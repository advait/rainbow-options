import * as moment from "moment";

export const CALL = "call";
export const PUT = "put";

/**
 * @typedef {{quantity: number, type: string, t: number, k: number}} Leg
 * @typedef {{legs: Leg[], entryCost: number}} Portfolio
 */

/**
 * @type Portfolio
 */
export const portfolio = {
  legs: [
    // TSLA March 2021 550 Call
    // {quantity: 1, type: CALL, k: 550, t: moment().add(1.2, 'year')},
    {quantity: 1, type: CALL, k: 550, t: moment().add(1, 'year')},
  ],
  entryCost: 197.03,
  // entryCost: 17.03,
};

/**
 * @param {Leg} leg
 * @returns {string}
 */
export function legToString(leg) {
  return `${leg.quantity} ${leg.type} ${leg.k} ${leg.t}`;
}