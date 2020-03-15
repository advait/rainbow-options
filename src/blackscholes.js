import {GPU} from "gpu.js";
import {CALL, PUT} from "./portfolio";
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
    if (leg.type === CALL) {
      // TODO(advait): We have to incorporate purchase price here
      const legT = leg.t.diff(t, 'years', true);
      return leg.quantity * euroCall(s, leg.k, legT, r, sigma);
    } else if (leg.type === PUT) {
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

export function portfolioValue(widthPx, heightPx, t0, tFinal, y0, yFinal, portfolio, r, sigma) {
  // Switch from moment dates to number dates in terms of fractions of years
  const now = moment();
  const x0 = t0.diff(now, 'years', true);
  const xFinal = tFinal.diff(now, 'years', true);

  // Compute the value for each leg
  const legResults = portfolio.legs.map((leg) => {
    if (leg.type === CALL) {
      const kernel = gpu.createKernel(function (widthPx, heightPx, x0, xFinal, y0, yFinal, quantity, k, legT, r, sigma) {
        let time = this.thread.x / widthPx * (xFinal - x0) + x0;
        let price = this.thread.y / heightPx * (yFinal - y0) + y0;
        return quantity * euroCall(price, k, legT - time, r, sigma);
      });
      const render = kernel.setOutput([widthPx, heightPx]);
      const legT = leg.t.diff(now, 'years', true);
      const ret = render(widthPx, heightPx, x0, xFinal, y0, yFinal, leg.quantity, leg.k, legT, r, sigma);
      kernel.destroy();
      return ret;
    } else if (leg.type === PUT) {
      throw Error("Invalid type: " + leg.type);
    } else {
      throw Error("Invalid type: " + leg.type);
    }
  });

  // Sum up the leg values, net of entry cost
  let kernel = gpu.createKernel(function (legResults, nLegs, netEntryCost) {
    let sum = 0;
    for (let leg = 0; leg < nLegs; leg++) {
      sum += legResults[leg][this.thread.y][this.thread.x];
    }
    return sum - netEntryCost;
  });
  let render = kernel.setOutput([widthPx, heightPx]);
  let summedResults = render(legResults, legResults.length, portfolio.entryCost);
  kernel.destroy();

  // Compute max and min values
  let maxValue = -Infinity;
  let minValue = Infinity;
  for (let x = 0; x < widthPx; x++) {
    for (let y = 0; y < heightPx; y++) {
      const value = summedResults[y][x];
      if (value > maxValue) {
        maxValue = value;
      }
      if (value < minValue) {
        minValue = value;
      }
    }
  }

  // Normalize values based on pct gain
  kernel = gpu.createKernel(function (summedResults, minValue, colorTable, colorTableLength) {
    const value = summedResults[this.thread.y][this.thread.x];
    return value / (-minValue); // -1 to +Inf
  });

  render = kernel.setOutput([widthPx, heightPx]);
  let pctGain = render(summedResults, minValue, colorTable, colorTable.length);
  kernel.destroy();

  return {
    summedResults,
    pctGain,
    minValue,
    maxValue
  };
}

const colorTable = [
  -1, 0xb71c1c,
  -0.8, 0xd32f2f,
  -0.6, 0xf44336,
  -0.3, 0xffa4a2,
  0, 0xffebee,
  0.2, 0xf7f6ed,
  0.4, 0xc5e1a5,
  0.6, 0xd5edbb,
  0.8, 0xc6ff00,
  1.0, 0x76ff03,
  1.5, 0x36ff09,
  2.0, 0x38ff3b,
  5.0, 0x00e5ff,
  Infinity, 0x18ffff
];
