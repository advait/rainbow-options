import _ from "lodash";
import {Moment} from "moment";
import * as blackscholes from "./blackscholes";

const moment = require("moment");

/**
 * Represents an options portfolio consisting of multiple legs.
 */
export type Portfolio = {
  legs: Leg[],
  entryTime: Moment,
}

/**
 * Represents a single leg/option within an options portfolio.
 */
export type Leg = {
  quantity: number,
  putCall: PutCall,
  k: number,
  t: Moment,
  iv: number,
}

export enum PutCall {
  PUT,
  CALL,
}

/**
 * @type Portfolio
 */
export const portfolio: Portfolio = {
  legs: [
    {quantity: 1, putCall: PutCall.CALL, k: 3, t: moment().add(120, 'days'), iv: 1.2},
  ],
  entryTime: moment(),
};

/**
 * Returns the expiration date of the earliest-expiring option in the portfolio.
 */
export function getEarliestExpiration(portfolio: Portfolio): Moment {
  const arr = portfolio.legs.map(l => l.t);
  arr.sort((a, b) => a.isBefore(b) ? -1 : 1);
  return arr[0];
}

export function legToString(leg: Leg): string {
  return `${leg.quantity} ${leg.putCall} ${leg.k} ${leg.t}`;
}

export function portfolioEntryCost(entryStockPrice: number, portfolio: Portfolio, r: number): number {
  return blackscholes.portfolioGrossValuePoint(entryStockPrice, portfolio.entryTime, portfolio, r);
}

/**
 * Returns the overall portfolio IV as a weighted average of each leg's IV where the weight is the absolute value of
 * the quantity.
 * @param portfolio
 */
export function weightedIV(portfolio: Portfolio): number {
  const sum = _.chain(portfolio.legs)
      .map(l => Math.abs(l.quantity) * l.iv)
      .sum()
      .value();
  const totalLegs = _.chain(portfolio.legs)
      .map(l => Math.abs(l.quantity))
      .sum()
      .value();
  return sum / totalLegs;
}
