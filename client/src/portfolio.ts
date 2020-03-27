import _ from "lodash";
import { Moment } from "moment";
import { euroCall, euroPut } from "./blackscholes.gpu";
import { deserializeDate, serializeDate } from "./graphql";

const moment = require("moment");

/**
 * Represents an options portfolio consisting of multiple legs.
 */
export type Portfolio = {
  legs: Leg[];
  entryTime: Moment;
};

/**
 * Represents a single leg/option within an options portfolio.
 */
export type Leg = {
  quantity: number;
  putCall: PutCall;
  k: number;
  t: Moment;
  iv: number;
};

export enum PutCall {
  PUT,
  CALL,
}

/**
 * @type Portfolio
 */
export const defaultPortfolio: Portfolio = {
  legs: [
    {
      quantity: 1,
      putCall: PutCall.CALL,
      k: 4,
      t: moment().add(182, "days"),
      iv: 1.2,
    },
  ],
  entryTime: moment(),
};

/**
 * Returns the expiration date of the earliest-expiring option in the portfolio.
 */
export function getEarliestExpiration(portfolio: Portfolio): Moment {
  const arr = portfolio.legs.map((l) => l.t);
  arr.sort((a, b) => (a.isBefore(b) ? -1 : 1));
  return arr[0];
}

/**
 * Returns the overall portfolio IV as a weighted average of each leg's IV where the weight is the absolute value of
 * the quantity.
 * @param portfolio
 */
export function weightedIV(portfolio: Portfolio): number {
  const sum = _.chain(portfolio.legs)
    .map((l) => Math.abs(l.quantity) * l.iv)
    .sum()
    .value();
  const totalLegs = _.chain(portfolio.legs)
    .map((l) => Math.abs(l.quantity))
    .sum()
    .value();
  return sum / totalLegs;
}

export function portfolioToURL(portfolio: Portfolio): string {
  const json = JSON.stringify({
    ...portfolio,
    legs: portfolio.legs.map((l) => ({ ...l, t: serializeDate(l.t) })),
    entryTime: serializeDate(portfolio.entryTime),
  });
  return encodeURI(json);
}

export function portfolioFromURL(url: string): Portfolio {
  const temp = JSON.parse(decodeURI(url));
  return {
    ...temp,
    legs: temp.legs.map((l: any) => ({ ...l, t: deserializeDate(l.t) })),
    entryTime: deserializeDate(temp.entryTime),
  };
}

/**
 * Returns the entry cost of a single leg (ignoring quantity) at the given stock price and time.
 * @param s {number} Stock price
 * @param t {moment.Moment} Point in time to measure the portfolio value
 * @param leg {Leg} the leg to measure
 * @param r {number} risk free rate
 * @returns {number} gross value of the portfolio
 */
export function legGrossValueAtPoint(
  s: number,
  t: Moment,
  leg: Leg,
  r: number
) {
  if (leg.putCall === PutCall.CALL) {
    const legT = leg.t.diff(t, "years", true);
    return euroCall(s, leg.k, legT, r, leg.iv);
  } else if (leg.putCall === PutCall.PUT) {
    const legT = leg.t.diff(t, "years", true);
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
export function portfolioGrossValuePoint(
  s: number,
  t: Moment,
  portfolio: Portfolio,
  r: number
) {
  return _.chain(portfolio.legs)
    .map((leg) => leg.quantity * legGrossValueAtPoint(s, t, leg, r))
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
export function portfolioNetValuePoint(
  entryStockPrice: number,
  s: number,
  t: Moment,
  portfolio: Portfolio,
  r: number
) {
  const entryValue = portfolioGrossValuePoint(
    entryStockPrice,
    portfolio.entryTime,
    portfolio,
    r
  );
  const endingValue = portfolioGrossValuePoint(s, t, portfolio, r);

  const netValue = endingValue - entryValue;
  const pctGain = netValue / entryValue;
  return {
    endingValue,
    netValue,
    pctGain,
  };
}

export function portfolioEntryCost(
  entryStockPrice: number,
  portfolio: Portfolio,
  r: number
) {
  return portfolioGrossValuePoint(
    entryStockPrice,
    portfolio.entryTime,
    portfolio,
    r
  );
}
