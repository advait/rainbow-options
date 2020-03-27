import { GPU } from "gpu.js";
import { PutCall } from "./portfolio";

/**
 * The CDF of the normal distribution with mean = 0 and stdev = 1.
 * @param x {number} the value to look up.
 * @returns {number} the CDF value.
 */
export function normalCdf(x) {
  // HASTINGS.  MAX ERROR = .000001
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const probability =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
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
  const d1 =
    (Math.log(s / k) + (r + Math.pow(sigma, 2) / 2) * t) /
    (sigma * Math.sqrt(t));
  const d2 = d1 - sigma * Math.sqrt(t);
  return s * normalCdf(d1) - k * Math.exp(-r * t) * normalCdf(d2);
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
  const d1 =
    (Math.log(s / k) + (r + Math.pow(sigma, 2) / 2) * t) /
    (sigma * Math.sqrt(t));
  const d2 = d1 - sigma * Math.sqrt(t);
  return k * Math.exp(-r * t) * normalCdf(-d2) - s * normalCdf(-d1);
}

const gpu = new GPU();
gpu.addFunction(normalCdf);
gpu.addFunction(euroCall);
gpu.addFunction(euroPut);

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
  portfolio.legs.forEach((leg) => {
    ret.push(leg.quantity);
    ret.push(leg.putCall === PutCall.PUT ? 0 : 1);
    ret.push(leg.k);
    ret.push(leg.t.diff(portfolio.entryTime, "years", true));
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
 * @param portfolio {Portfolio}
 * @param portfolioEntryCost {number}
 * @param r {number}
 * @returns {{minValue: number, pctGain: number[]}}
 */
export function portfolioValue(
  widthPx,
  heightPx,
  t0,
  tFinal,
  y0,
  yFinal,
  portfolio,
  portfolioEntryCost,
  r
) {
  performance.mark("portfolioValueStart");

  // Switch from moment dates to number dates in terms of fractions of years
  const x0 = t0.diff(portfolio.entryTime, "years", true);
  const xFinal = tFinal.diff(portfolio.entryTime, "years", true);

  // Compute the net value (value - entry cost) for the whole options portfolio on the gpu
  performance.mark("gpuLegStart");
  let kernel = gpu.createKernel(function (
    widthPx,
    heightPx,
    x0,
    xFinal,
    y0,
    yFinal,
    serializedPortfolio,
    r
  ) {
    const y = Math.floor(this.thread.x / widthPx);
    const x = this.thread.x % widthPx;
    let t0 = (x / widthPx) * (xFinal - x0) + x0;
    let price = (y / heightPx) * (yFinal - y0) + y0;
    const entryCost = serializedPortfolio[0];
    const legsLength = serializedPortfolio[1];
    const metadataPerLeg = 5;
    let totalValue = 0;
    for (let i = 0; i < legsLength; i++) {
      const quantity = serializedPortfolio[i * metadataPerLeg + 2];
      const type = serializedPortfolio[i * metadataPerLeg + 3];
      const k = serializedPortfolio[i * metadataPerLeg + 4];
      const legT = serializedPortfolio[i * metadataPerLeg + 5];
      const iv = serializedPortfolio[i * metadataPerLeg + 6];
      if (type === 0) {
        totalValue += quantity * euroPut(price, k, legT - t0, r, iv);
      } else {
        totalValue += quantity * euroCall(price, k, legT - t0, r, iv);
      }
    }
    return totalValue - entryCost;
  });
  let render = kernel.setOutput([widthPx * heightPx]);
  const serializedPortfolio = serializePortfolio(portfolio, portfolioEntryCost);
  const summedResults = render(
    widthPx,
    heightPx,
    x0,
    xFinal,
    y0,
    yFinal,
    serializedPortfolio,
    r
  );
  kernel.destroy();

  // Compute min value so we can normalize based on pct gain
  let minValue = Infinity;
  for (let i = 0; i < summedResults.length; i++) {
    const value = summedResults[i];
    if (value < minValue) {
      minValue = value;
    }
  }
  const pctGain = summedResults.map((v) => v / -minValue); // -1 to +Inf
  performance.measure("portfolioValue", "portfolioValueStart");

  return {
    pctGain,
    minValue,
  };
}
