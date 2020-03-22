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
  entryValue?: number,
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
    // {quantity: -1, type: LegType.CALL, k: 700, t: moment().add(1, 'year')},
    {quantity: 1, putCall: PutCall.CALL, k: 0, t: moment().add(91, 'days')},
    // {quantity: 1, type: LegType.CALL, k: 650, t: moment().add(1, 'year')},
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

export function portfolioEntryCost(entryStockPrice: number, portfolio: Portfolio, r: number, sigma: number): number {
  return blackscholes.portfolioGrossValuePoint(entryStockPrice, portfolio.entryTime, portfolio, r, sigma);
}
