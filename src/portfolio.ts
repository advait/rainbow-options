import {Moment} from "moment";
const moment = require("moment");

/**
 * Represents an options portfolio consisting of multiple legs.
 */
export type Portfolio = {
  legs: Leg[],
  entryCost: number,
}

/**
 * Represents a single leg/option within an options portfolio.
 */
export type Leg = {
  quantity: number,
  type: LegType,
  k: number,
  t: Moment,
}

export enum LegType {
  PUT,
  CALL,
}

/**
 * @type Portfolio
 */
export const portfolio: Portfolio = {
  legs: [
    // TSLA March 2021 550 Call
    {quantity: 1, type: LegType.CALL, k: 560, t: moment().add(1.2, 'year')},
    {quantity: -1, type: LegType.CALL, k: 550, t: moment().add(1, 'year')},
  ],
  // entryCost: 197.03,
  entryCost: 17.03,
};

export function legToString(leg: Leg): string {
  return `${leg.quantity} ${leg.type} ${leg.k} ${leg.t}`;
}