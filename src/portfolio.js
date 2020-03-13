export const CALL = "call";
export const PUT = "put";

export const portfolio = {
  legs: [
    // TSLA March 2021 550 Call
    {quantity: 1, type: CALL, k: 550, t: 1},
    //{quantity: -1, type: CALL, k: 105, t: 2},
  ]
};

export function legToString(leg) {
  return `${leg.quantity} ${leg.type} ${leg.k} ${leg.t}`;
}