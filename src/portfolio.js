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
    {quantity: 1, type: CALL, k: 550, t: 1},
    //{quantity: -1, type: CALL, k: 105, t: 2},
  ],
  entryCost: 196.33,
};

/**
 * @param {Leg} leg
 * @returns {string}
 */
export function legToString(leg) {
  return `${leg.quantity} ${leg.type} ${leg.k} ${leg.t}`;
}