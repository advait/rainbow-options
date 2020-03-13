export const CALL = "call";
export const PUT = "put";

export const portfolio = {
  legs: [
    {quantity: 1, type: CALL, k: 100, t: 2},
    //{quantity: 1, type: CALL, k: 105, t: 2}
  ]
};

export function legToString(leg) {
  return `${leg.quantity} ${leg.type} ${leg.k} ${leg.t}`;
}