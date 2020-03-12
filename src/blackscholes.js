/**
 * The CDF of the normal distribution.
 * @param x {Number} the value to look up.
 * @param mean {Number} the mean of the underlying distribution.
 * @param stdev {Number} the standard deviation of the underlying distribution.
 * @returns {number} the CDF value.
 */
export function normalCdf(x, mean= 0.0, stdev= 1.0) {
    // HASTINGS.  MAX ERROR = .000001
    const normalizedValue = (x - mean) / stdev;
    const t = 1 / (1 + .2316419 * Math.abs(normalizedValue));
    const d = .3989423 * Math.exp(-normalizedValue * normalizedValue / 2);
    const probability = d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (normalizedValue > 0) {
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
        return Math.max(0, k-s);
    } else if (t < 0) {
        return 0;
    }
    const d1 = (Math.log(s / k) + (r + Math.pow(sigma, 2) / 2.) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - (sigma * Math.sqrt(t));
    return (k * Math.exp(-r*t) * normalCdf(-d2) - s * normalCdf(-d1));
}
