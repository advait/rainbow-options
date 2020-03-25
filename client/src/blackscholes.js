import {GPU} from "gpu.js";
import {PutCall, portfolioEntryCost} from "./portfolio";
import moment from "moment";
import * as _ from "lodash";

/**
 * The CDF of the normal distribution with mean = 0 and stdev = 1.
 * @param x {number} the value to look up.
 * @returns {number} the CDF value.
 */
export function normalCdf(x) {
  // HASTINGS.  MAX ERROR = .000001
  const t = 1 / (1 + .2316419 * Math.abs(x));
  const d = .3989423 * Math.exp(-x * x / 2);
  const probability = d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) {
    return 1 - probability;
  } else {
    return probability;
  }
}

/**
 * Returns the value of a European call option.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 * @returns {number} the value of the call option.
 */
export function euroCall(s, k, t, r, sigma) {
  if (t === 0) {
    return Math.max(0, s - k);
  } else if (t < 0) {
    return 0;
  }
  const d1 = (Math.log(s / k) + (r + Math.pow(sigma, 2) / 2.) * t) / (sigma * Math.sqrt(t));
  const d2 = d1 - (sigma * Math.sqrt(t));
  return (s * normalCdf(d1) - k * Math.exp(-r * t) * normalCdf(d2));
}

/**
 * Returns the value of a European put option.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 * @returns {number} the value of the call option.
 */
export function euroPut(s, k, t, r, sigma) {
  if (t === 0) {
    return Math.max(0, k - s);
  } else if (t < 0) {
    return 0;
  }
  const d1 = (Math.log(s / k) + (r + Math.pow(sigma, 2) / 2.) * t) / (sigma * Math.sqrt(t));
  const d2 = d1 - (sigma * Math.sqrt(t));
  return (k * Math.exp(-r * t) * normalCdf(-d2) - s * normalCdf(-d1));
}

const gpu = new GPU();
gpu.addFunction(normalCdf);
gpu.addFunction(euroCall);
gpu.addFunction(euroPut);

/**
 * Returns the entry cost of a single leg (ignoring quantity) at the given stock price and time.
 * @param s {number} Stock price
 * @param t {moment.Moment} Point in time to measure the portfolio value
 * @param leg {Leg} the leg to measure
 * @param r {number} risk free rate
 * @returns {number} gross value of the portfolio
 */
export function legGrossValueAtPoint(s, t, leg, r) {
  if (leg.putCall === PutCall.CALL) {
    const legT = leg.t.diff(t, 'years', true);
    return euroCall(s, leg.k, legT, r, leg.iv);
  } else if (leg.putCall === PutCall.PUT) {
    const legT = leg.t.diff(t, 'years', true);
    return euroPut(s, leg.k, legT, r, leg.iv);
  } else {
    throw Error("Invalid type: " + leg.putCall);
  }
}

/**
 * Returns the total value of the portfolio at a given stock price and time.
 * @param s {number} Stock price
 * @param t {moment.Moment} Point in time to measure the portfolio value
 * @param portfolio {Portfolio} the portfolio to measure
 * @param r {number} risk free rate
 * @returns {number} gross value of the portfolio
 */
export function portfolioGrossValuePoint(s, t, portfolio, r) {
  return _.chain(portfolio.legs)
      .map(leg => leg.quantity * legGrossValueAtPoint(s, t, leg, r))
      .sum()
      .value();
}

/**
 * Returns the value of the portfolio at a given stock price and time.
 * @param entryStockPrice {number} The stock price when the portfolio was purchased
 * @param s {number} The stock price that we are using to lookup the portfolio value
 * @param t {moment.Moment} Point in time to measure the portfolio value
 * @param portfolio {Portfolio} the portfolio to measure
 * @param r {number} risk free rate
 * @returns {{endingValue: number, netValue: number, pctGain, number}} value of the portfolio
 */
export function portfolioNetValuePoint(entryStockPrice, s, t, portfolio, r) {
  const entryValue = portfolioGrossValuePoint(entryStockPrice, portfolio.entryTime, portfolio, r);
  const endingValue = portfolioGrossValuePoint(s, t, portfolio, r);

  const netValue = endingValue - entryValue;
  const pctGain = netValue / entryValue;
  return {
    endingValue,
    netValue,
    pctGain,
  };
}

/**
 * Serializes a portfolio into an array that can be read by the GPU.
 * @param portfolio {Portfolio}
 * @param portfolioEntryCost {number}
 * @returns number[]
 */
function serializePortfolio(portfolio, portfolioEntryCost) {
  const ret = [];
  // First push portfolio metadata
  ret.push(portfolioEntryCost);
  ret.push(portfolio.legs.length);
  // Next push each leg data sequentially
  portfolio.legs.forEach(leg => {
    // TODO(advait): Compute startT based on some provided value
    ret.push(leg.quantity);
    ret.push(leg.putCall === PutCall.PUT ? 0 : 1);
    ret.push(leg.k);
    ret.push(leg.t.diff(moment(), 'years', true));
    ret.push(leg.iv);
  });
  return ret;
}

/**
 * @param widthPx {number}
 * @param heightPx {number}
 * @param t0 {number}
 * @param tFinal {number}
 * @param y0 {number}
 * @param yFinal {number}
 * @param entryStockPrice {number}
 * @param portfolio {Portfolio}
 * @param r {number}
 * @returns {{minValue: number, pctGain: number[]}}
 */
export function portfolioValue(widthPx, heightPx, t0, tFinal, y0, yFinal, entryStockPrice, portfolio, r) {
  performance.mark("portfolioValueStart");

  // Switch from moment dates to number dates in terms of fractions of years
  const x0 = t0.diff(portfolio.entryTime, 'years', true);
  const xFinal = tFinal.diff(portfolio.entryTime, 'years', true);

  const entryCost = portfolioEntryCost(entryStockPrice, portfolio, r);

  // Compute the net value (value - entry cost) for the whole options portfolio on the gpu
  performance.mark("gpuLegStart");
  let kernel = gpu.createKernel(function (widthPx, heightPx, x0, xFinal, y0, yFinal, serializedPortfolio, r) {
    const y = Math.floor(this.thread.x / widthPx);
    const x = this.thread.x % widthPx;
    let time = x / widthPx * (xFinal - x0) + x0;
    let price = y / heightPx * (yFinal - y0) + y0;
    const entryCost = serializedPortfolio[0];
    const legsLength = serializedPortfolio[1];
    let totalValue = 0;
    for (let i = 0; i < legsLength; i++) {
      const quantity = serializedPortfolio[2 + i * 4];
      const type = serializedPortfolio[3 + i * 4];
      const k = serializedPortfolio[4 + i * 4];
      const legT = serializedPortfolio[5 + i * 4];
      const iv = serializedPortfolio[6 + i * 4];
      if (type === 0) {
        totalValue += quantity * euroPut(price, k, legT - time, r, iv);
      } else {
        totalValue += quantity * euroCall(price, k, legT - time, r, iv);
      }
    }
    return totalValue - entryCost;
  });
  let render = kernel.setOutput([widthPx * heightPx]);
  const serializedPortfolio = serializePortfolio(portfolio, entryCost);
  const summedResults = render(widthPx, heightPx, x0, xFinal, y0, yFinal, serializedPortfolio, r);
  kernel.destroy();

  // Compute min value so we can normalize based on pct gain
  let minValue = Infinity;
  for (let i = 0; i < summedResults.length; i++) {
    const value = summedResults[i];
    if (value < minValue) {
      minValue = value;
    }
  }
  const pctGain = summedResults.map(v => v / (-minValue)); // -1 to +Inf
  performance.measure("portfolioValue", "portfolioValueStart");

  return {
    pctGain,
    minValue
  };
}
