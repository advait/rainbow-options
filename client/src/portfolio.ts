import _ from "lodash";
import { Moment } from "moment";
import * as querystring from "querystring";
import * as blackscholes from "./blackscholes";
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

export function portfolioEntryCost(
  entryStockPrice: number,
  portfolio: Portfolio,
  r: number
): number {
  return blackscholes.portfolioGrossValuePoint(
    entryStockPrice,
    portfolio.entryTime,
    portfolio,
    r
  );
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
