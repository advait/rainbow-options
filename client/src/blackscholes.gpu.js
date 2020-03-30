import { GPU } from "gpu.js";
import { PutCall } from "./portfolio";

/**
 * Black Scholes equations explicitly designed to run on the GPU via gpu.js.
 * Thanks to: https://en.wikipedia.org/wiki/Black%E2%80%93Scholes_model#Black%E2%80%93Scholes_equation
 */

/**
 * The PDF of the normal distribution with mean = 1 and stdev = 1.
 * @param x {number} the value to look up.
 * @return {number} the PDF value.
 */
export function normalPdf(x) {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-(Math.pow(x, 2) / 2));
}

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
 * Standard d1 term used in option pricing.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function d1(s, k, t, r, sigma) {
  return (
    (Math.log(s / k) + (r + Math.pow(sigma, 2) / 2) * t) /
    (sigma * Math.sqrt(t))
  );
}

/**
 * Standard d2 term used in option pricing.
 * @param d1_ {Number} The value of d1
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function d2(d1_, s, k, t, r, sigma) {
  return d1_ - sigma * Math.sqrt(t);
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

  const d1_ = d1(s, k, t, r, sigma);
  const d2_ = d2(d1_, s, k, t, r, sigma);
  return s * normalCdf(d1_) - k * Math.exp(-r * t) * normalCdf(d2_);
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
  const d1_ = d1(s, k, t, r, sigma);
  const d2_ = d2(d1_, s, k, t, r, sigma);
  return k * Math.exp(-r * t) * normalCdf(-d2_) - s * normalCdf(-d1_);
}

/**
 * Returns the greek delta for a call option.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function euroDeltaCall(s, k, t, r, sigma) {
  return normalCdf(d1(s, k, t, r, sigma));
}

/**
 * Returns the greek delta for a put option.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function euroDeltaPut(s, k, t, r, sigma) {
  return normalCdf(d1(s, k, t, r, sigma)) - 1;
}

/**
 * Returns the greek gamma.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function euroGamma(s, k, t, r, sigma) {
  const d1_ = d1(s, k, t, r, sigma);
  return (1 / (s * sigma * Math.sqrt(t))) * normalPdf(d1_);
}

/**
 * Returns the greek vega.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function euroVega(s, k, t, r, sigma) {
  const d1_ = d1(s, k, t, r, sigma);
  return (s / 100) * Math.sqrt(t) * normalPdf(d1_);
}

/**
 * Returns the greek rho for a call option.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function euroRhoCall(s, k, t, r, sigma) {
  const d1_ = d1(s, k, t, r, sigma);
  const d2_ = d2(d1_, s, k, t, r, sigma);
  return (k / 100) * t * Math.exp(-r * t) * normalCdf(d2_);
}

/**
 * Returns the greek rho for a put option.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function euroRhoPut(s, k, t, r, sigma) {
  const d1_ = d1(s, k, t, r, sigma);
  const d2_ = d2(d1_, s, k, t, r, sigma);
  return (-k / 100) * t * Math.exp(-r * t) * normalCdf(-d2_);
}

/**
 * Returns the greek theta for a put option quoted in terms of dollars changed
 * per day.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function euroThetaCall(s, k, t, r, sigma) {
  const d1_ = d1(s, k, t, r, sigma);
  const d2_ = d2(d1_, s, k, t, r, sigma);

  const p1 = (s * normalPdf(d1_) * sigma) / (2 * Math.sqrt(t));
  const p2 = r * k * Math.exp(-r * t) * normalCdf(d2_);
  const thetaPerYear = -p1 - p2;
  return thetaPerYear / 365;
}

/**
 * Returns the greek theta for a call option quoted in terms of dollars changed
 * per day.
 * @param s {Number} Price of the stock
 * @param k {Number} Strike price of the option
 * @param t {Number} Time to maturity (in years)
 * @param r {Number} Risk-free interest rate (in years)
 * @param sigma {Number} Volatility (annual one-std volatility divided by s)
 */
export function euroThetaPut(s, k, t, r, sigma) {
  const d1_ = d1(s, k, t, r, sigma);
  const d2_ = d2(d1_, s, k, t, r, sigma);

  const p1 = (s * normalPdf(d1_) * sigma) / (2 * Math.sqrt(t));
  const p2 = r * k * Math.exp(-r * t) * normalCdf(-d2_);
  const thetaPerYear = -p1 + p2;
  return thetaPerYear / 365;
}

const gpu = new GPU();
gpu.addFunction(normalPdf);
gpu.addFunction(normalCdf);
gpu.addFunction(d1);
gpu.addFunction(d2);
gpu.addFunction(euroCall);
gpu.addFunction(euroPut);

/**
 * Serializes a portfolio into an array that can be read by the GPU.
 * @param portfolio {Portfolio}
 * @param r {number} Risk-free interest rate
 * @returns number[]
 */
function serializePortfolio(portfolio, r) {
  const ret = [];
  // First push portfolio metadata
  ret.push(portfolio.entryCost(r));
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
 * Uses the GPU to compute a grid of values of profitability for the given portfolio.
 * @param widthPx {number} The number of horizontal points to measure
 * @param heightPx {number} The number of vertical points to measure
 * @param t0 {number} The left-most value on the horizontal axis (time)
 * @param tFinal {number} The right-most value on the horizontal axis (time)
 * @param y0 {number} The top-most value on the vertical axis (stock price)
 * @param yFinal {number} The bottom-most value on the vertical axis (stock price)
 * @param portfolio {Portfolio} The portfolio whose value to compute
 * @param r {number} The risk-free interest rate
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
  const serializedPortfolio = serializePortfolio(portfolio, r);
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
