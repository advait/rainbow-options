import {euroCall, euroPut, normalCdf} from './blackscholes';

test("normalCdf", () => {
  // X, CDF(X)
  const table = [
    [-5, 1.867e-7],
    [-3, 1.35e-3],
    [-2.5, 6.21e-3],
    [-2, 2.275e-2],
    [-1, 0.1587],
    [0, 0.5],
    [1, 0.8413],
    [1.337, 0.9094],
    [2.222, 0.9869],
    [5, 1.0],
  ];
  table.forEach((item) => {
    const [x, expected] = item;
    expect(normalCdf(x)).toBeCloseTo(expected, 4);
  });
});

// Test data from: https://www.math.drexel.edu/~pg/fin/VanillaCalculator.html
// Price, Strike, Time, Risk-free, Volatility, Call Value, Put Value
const optionsTable = [
  [100, 100, 1, 0.05, 0.2, 10.45058, 5.57352],
  [100, 105, 1, 0.05, 0.2, 8.02136, 7.90045],
  [100, 105, 0, 0.05, 0.2, 0, 5.],
  [105, 100, 1, 0.05, 0.2, 13.85792, 3.98086],
  [105, 100, 2, 0.05, 0.2, 19.72404, 5.20778],
  [105, 100, 0, 0.05, 0.2, 5., 0],
  [1, 1, 1, 0.05, 0.2, 0.10451, 0.05574],
  [1, 1, 1, 0.10, 0.2, 0.13270, 0.03753],
  [1, 1, 1, 0.10, 1, 0.41396, 0.31880],
];

test("euroCall, euroPut", () => {
  optionsTable.forEach((item) => {
    const [s, k, t, r, vol, call, put] = item;
    expect(euroCall(s, k, t, r, vol)).toBeCloseTo(call, 4);
    expect(euroPut(s, k, t, r, vol)).toBeCloseTo(put, 4);
  });
});
