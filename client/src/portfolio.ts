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

  /**
   * The value of this option leg at entry time (used to compute per-leg IV).
   */
  entryCost?: number,
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
    {quantity: -1, putCall: PutCall.CALL, k: 6, t: moment().add(120, 'days'), iv: 0.7},
    {quantity: 1, putCall: PutCall.CALL, k: 3, t: moment().add(120, 'days'), iv: 0.7},
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

export function portfolioEntryCost(entryStockPrice: number, portfolio: Portfolio, r: number, sigma: number = 0): number {
  return blackscholes.portfolioGrossValuePoint(entryStockPrice, portfolio.entryTime, portfolio, r, sigma);
}
