import {GPU} from "gpu.js";
import {LegType} from "./portfolio";
import moment from "moment";

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
 * Returns the value of the portfolio at a given stock price and time.
 * @param s {number} Stock price
 * @param t {moment.Moment} Point in time to measure the portfolio value
 * @param portfolio {Portfolio} the portfolio to measure
 * @param r {number} risk free rate
 * @param sigma {number} volatility
 * @returns {{endingValue: number, netValue: number, pctGain, number}} value of the portfolio
 */
export function portfolioValuePoint(s, t, portfolio, r, sigma) {
  const entryCosts = portfolio.legs.map((leg) => {
    if (leg.type === LegType.CALL) {
      // TODO(advait): We have to incorporate purchase price here
      const legT = leg.t.diff(t, 'years', true);
      return leg.quantity * euroCall(s, leg.k, legT, r, sigma);
    } else if (leg.type === LegType.PUT) {
      const legT = leg.t.diff(t, 'years', true);
      return leg.quantity * euroPut(s, leg.k, legT, r, sigma);
    } else {
      throw Error("Invalid type: " + leg.type);
    }
  });

  const endingValue = entryCosts.reduce((a, b) => a + b, 0);
  const netValue = endingValue - portfolio.entryCost;
  const pctGain = netValue / portfolio.entryCost;
  return {
    endingValue,
    netValue,
    pctGain,
  };
}

/**
 * Serializes a portfolio into an array that can be read by the GPU.
 * @param portfolio {Portfolio}
 * @returns number[]
 */
function serializePortfolio(portfolio) {
  const ret = [];
  // First push portfolio metadata
  ret.push(portfolio.entryCost);
  ret.push(portfolio.legs.length);
  // Next push each leg data sequentially
  portfolio.legs.forEach(leg => {
    // TODO(advait): Compute startT based on some provided value
    ret.push(leg.quantity);
    ret.push(leg.type === LegType.PUT ? 0 : 1);
    ret.push(leg.k);
    ret.push(leg.t.diff(moment(), 'years', true));
  });
  return ret;
}

export function portfolioValue(widthPx, heightPx, t0, tFinal, y0, yFinal, portfolio, r, sigma) {
  performance.mark("portfolioValueStart");

  // Switch from moment dates to number dates in terms of fractions of years
  const now = moment();
  const x0 = t0.diff(now, 'years', true);
  const xFinal = tFinal.diff(now, 'years', true);

  // Compute the net value (value - entry cost) for the whole options portfolio on the gpu
  performance.mark("gpuLegStart");
  let kernel = gpu.createKernel(function (widthPx, heightPx, x0, xFinal, y0, yFinal, serializedPortfolio, r, sigma) {
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
      if (type === 0) {
        totalValue += quantity * euroPut(price, k, legT - time, r, sigma);
      } else {
        totalValue += quantity * euroCall(price, k, legT - time, r, sigma);
      }
    }
    return totalValue - entryCost;
  });
  let render = kernel.setOutput([widthPx * heightPx]);
  const serializedPortfolio = serializePortfolio(portfolio);
  const summedResults = render(widthPx, heightPx, x0, xFinal, y0, yFinal, serializedPortfolio, r, sigma);
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
