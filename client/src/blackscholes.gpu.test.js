import {
  euroCall,
  euroDeltaCall,
  euroDeltaPut,
  euroGamma,
  euroPut,
  euroRhoCall,
  euroRhoPut,
  euroThetaCall,
  euroThetaPut,
  euroVega,
  normalCdf,
  normalPdf,
} from "./blackscholes.gpu";
import * as _ from "lodash";

test("normalPdf, normalCdf", () => {
  // X, PDF(X), CDF(X)
  const table = [
    [-5, 0.00000149, 1.867e-7],
    [-3, 0.00443185, 1.35e-3],
    [-2.5, 0.0175283, 6.21e-3],
    [-2, 0.05399097, 2.275e-2],
    [-1, 0.24197072, 0.1587],
    [0, 0.39894228, 0.5],
    [1, 0.24197072, 0.8413],
    [1.337, 0.16320911, 0.9094],
    [2.222, 0.03379033, 0.9869],
    [5, 0.00000149, 1.0],
  ];
  table.forEach((item) => {
    const [x, expectedPdf, expectedCdf] = item;
    expect(normalPdf(x)).toBeCloseTo(expectedPdf, 4);
    expect(normalCdf(x)).toBeCloseTo(expectedCdf, 4);
  });
});

describe("euroCall, euroPut", () => {
  // Table calculations from: https://goodcalculators.com/black-scholes-calculator/
  const table = [
    {
      s: 100,
      k: 100,
      t: 1,
      r: 0.05,
      sigma: 0.2,
      euroCall: 10.45058,
      euroPut: 5.57352,
      euroDeltaCall: 0.63683,
      euroDeltaPut: -0.36317,
      euroGamma: 0.01876,
      euroVega: 0.3752403,
      euroRhoCall: 53.23248 / 100,
      euroRhoPut: -41.89046 / 100,
      euroThetaCall: -6.414 / 365,
      euroThetaPut: -1.658 / 365,
    },
    {
      s: 100,
      k: 105,
      t: 1,
      r: 0.05,
      sigma: 0.2,
      euroCall: 8.021,
      euroPut: 7.9,
      euroDeltaCall: 0.542,
      euroDeltaPut: -0.458,
      euroGamma: 0.01985,
      euroVega: 39.671 / 100,
      euroRhoCall: 46.201 / 100,
      euroRhoPut: -53.678 / 100,
      euroThetaCall: -6.277 / 365,
      euroThetaPut: -1.283 / 365,
    },
    {
      s: 105,
      k: 100,
      t: 1,
      r: 0.05,
      sigma: 0.2,
      euroCall: 13.858,
      euroPut: 3.981,
      euroDeltaCall: 0.724,
      euroDeltaPut: -0.276,
      euroGamma: 0.01592,
      euroVega: 35.115 / 100,
      euroRhoCall: 62.133 / 100,
      euroRhoPut: -32.989 / 100,
      euroThetaCall: -6.618 / 365,
      euroThetaPut: -1.862 / 365,
    },
    {
      s: 560.55,
      k: 560,
      t: 371 / 365,
      r: 0.007465,
      sigma: 0.6824,
      euroCall: 152.63,
      euroPut: 147.85,
      euroDeltaCall: 0.6392,
      euroDeltaPut: -0.3608,
      euroGamma: 0.00097,
      euroVega: 211.5 / 100,
      euroRhoCall: 209 / 100,
      euroRhoPut: -355.5 / 100,
      euroThetaCall: -72.558 / 365,
      euroThetaPut: -68.418 / 365,
    },
  ];

  table.forEach((item) => {
    const fns = {
      euroCall,
      euroPut,
      euroDeltaCall,
      euroDeltaPut,
      euroGamma,
      euroVega,
      euroRhoCall,
      euroRhoPut,
      euroThetaCall,
      euroThetaPut,
    };
    const expected = _.mapValues(fns, (fn) =>
      fn(item.s, item.k, item.t, item.r, item.sigma)
    );

    const desc = JSON.stringify({
      s: item.s,
      k: item.k,
      t: item.t,
      r: item.r,
      sigma: item.sigma,
    });
    describe(desc, () => {
      _.forIn(expected, (value, key) => {
        test(`${key}`, () => {
          expect(value).toBeCloseToSigFigs(item[key], 3);
        });
      });
    });
  });
});

expect.extend({
  toBeCloseToSigFigs(x, y, sigFigs) {
    const pctDiff = Math.abs((x - y) / x);
    if (pctDiff < Math.pow(10, -sigFigs)) {
      return {
        pass: true,
        message: () => "",
      };
    } else {
      return {
        pass: false,
        message: () =>
          `expected ${x.toFixed(5)} to be close to ${y.toFixed(5)}`,
      };
    }
  },
});
