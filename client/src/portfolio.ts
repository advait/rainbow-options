import _ from "lodash";
import { Moment } from "moment";
import {
  euroCall,
  euroDeltaCall,
  euroDeltaPut,
  euroGamma,
  euroPut,
  euroThetaCall,
  euroThetaPut,
} from "./blackscholes.gpu";
import { deserializeDate, serializeDate } from "./graphql";
import { assert } from "./util";

const moment = require("moment");

/**
 * Whether an Option is a Put or a Call.
 */
export enum PutCall {
  PUT,
  CALL,
}

/**
 * Represents a single leg/option within an options portfolio.
 */
export type Leg = {
  readonly quantity: number;
  readonly putCall: PutCall;
  readonly k: number;
  readonly t: Moment;
  readonly iv: number;
};

/**
 * Represents an options portfolio consisting of multiple legs.
 */
export class Portfolio {
  readonly legs: Leg[];
  readonly entryTime: Moment;
  readonly entryStockPrice: number;

  constructor(legs: Leg[], entryTime: Moment, entryStockPrice: number) {
    assert(legs.length > 0, "Portfolio must have legs");
    assert(moment.isMoment(entryTime), "entryTime must be a date");
    assert(entryStockPrice > 0, "Stock price must be > 0");
    this.legs = legs;
    this.entryTime = entryTime;
    this.entryStockPrice = entryStockPrice;
  }

  /**
   * Returns the expiration date of the earliest-expiring option in the portfolio.
   */
  getEarliestExpiration = (): Moment => {
    const arr = this.legs.map((l) => l.t);
    arr.sort((a, b) => (a.isBefore(b) ? -1 : 1));
    return arr[0];
  };

  /**
   * Returns the overall portfolio IV as a weighted average of each leg's IV where the weight is the absolute value of
   * the quantity.
   */
  weightedIV = (): number => {
    const ivs = this.legs.map((l) => Math.abs(l.quantity) * l.iv);
    const weights = this.legs.map((l) => Math.abs(l.quantity));
    return weightedAverage(ivs, weights) / _.sum(weights);
  };

  toURLSlug = (): string => {
    return JSON.stringify({
      legs: this.legs.map((l) => ({ ...l, t: serializeDate(l.t) })),
      entryTime: serializeDate(this.entryTime),
      entryStockPrice: this.entryStockPrice,
    });
  };

  static fromURLSlug = _.memoize(
    (slug: string): Portfolio => {
      const temp = JSON.parse(decodeURI(slug));
      const legs = temp.legs.map((l: any) => ({
        ...l,
        t: deserializeDate(l.t),
      }));
      const entryTime = deserializeDate(temp.entryTime);
      return new Portfolio(legs, entryTime, temp.entryStockPrice);
    }
  );

  /**
   * Returns the total value of the portfolio at a given stock price and time.
   * @param s Stock price
   * @param t Point in time to measure the portfolio value
   * @param r risk free rate
   * @returns gross value of the portfolio
   */
  grossValuePoint = (s: number, t: Moment, r: number): number => {
    return _.chain(this.legs)
      .map((leg) => leg.quantity * legGrossValueAtPoint(s, t, leg, r))
      .sum()
      .value();
  };

  greeks = (s: number, t: Moment, r: number) => {
    const allLegGreeks = this.legs.map((leg) => legGreeks(s, t, leg, r));
    const deltas = allLegGreeks.map((o) => o.delta);
    const gammas = allLegGreeks.map((o) => o.gamma);
    const thetas = allLegGreeks.map((o) => o.theta);
    const quantities = this.legs.map((l) => l.quantity);

    const avgDelta = weightedAverage(deltas, quantities);
    const avgGamma = weightedAverage(gammas, quantities);
    const avgTheta = weightedAverage(thetas, quantities);
    const maxLossValue = this.maxLoss(r);
    return {
      delta: avgDelta,
      deltaPct: avgDelta / -maxLossValue,
      gamma: avgGamma,
      gammaPct: avgGamma / -maxLossValue,
      theta: avgTheta,
      thetaPct: avgTheta / -maxLossValue,
    };
  };

  entryCost = _.memoize((r: number): number => {
    return this.grossValuePoint(this.entryStockPrice, this.entryTime, r);
  });

  maxLoss = (r: number): number => {
    // TODO(advait): Compute this based on the four corners approach and cache
    return -this.entryCost(r);
  };

  /**
   * Returns the value of the portfolio at a given stock price and time.
   * @param s The stock price that we are using to lookup the portfolio value
   * @param t Point in time to measure the portfolio value
   * @param r risk free rate
   * @returns value of the portfolio
   */
  netValuePoint = (s: number, t: Moment, r: number) => {
    const entryValue = this.entryCost(r);
    const endingValue = this.grossValuePoint(s, t, r);

    const netValue = endingValue - entryValue;
    const pctGain = netValue / entryValue;
    return {
      endingValue,
      netValue,
      pctGain,
    };
  };

  /**
   * Returns a new portfolio with the same entry time/cost but the provided
   * legs.
   * @param legs
   */
  withNewLegs(legs: Leg[]): Portfolio {
    return new Portfolio(legs, this.entryTime, this.entryStockPrice);
  }

  /**
   * Returns whether the two portfolios are equal.
   * @param other
   */
  equals(other: Portfolio): boolean {
    return this.toURLSlug() === other.toURLSlug();
  }
}

export const defaultPortfolio: Portfolio = new Portfolio(
  [
    {
      quantity: 1,
      putCall: PutCall.CALL,
      k: 4,
      t: moment().add(182, "days"),
      iv: 1.2,
    },
  ],
  moment(),
  5
);

/**
 * Returns the entry cost of a single leg (ignoring quantity) at the given stock price and time.
 * @param s Stock price
 * @param t Point in time to measure the portfolio value
 * @param leg the leg to measure
 * @param r risk free rate
 * @returns gross value of the portfolio
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

export function legGreeks(s: number, t: Moment, leg: Leg, r: number) {
  if (leg.putCall === PutCall.CALL) {
    const legT = leg.t.diff(t, "years", true);
    return {
      delta: euroDeltaCall(s, leg.k, legT, r, leg.iv),
      gamma: euroGamma(s, leg.k, legT, r, leg.iv),
      theta: euroThetaCall(s, leg.k, legT, r, leg.iv),
    };
  } else if (leg.putCall === PutCall.PUT) {
    const legT = leg.t.diff(t, "years", true);
    return {
      delta: euroDeltaPut(s, leg.k, legT, r, leg.iv),
      gamma: euroGamma(s, leg.k, legT, r, leg.iv),
      theta: euroThetaPut(s, leg.k, legT, r, leg.iv),
    };
  } else {
    throw Error("Invalid type: " + leg.putCall);
  }
}

type NumbersMap = { [k: string]: number };

/**
 * Given two objects whose values are numbers, return a new object whose
 * values are the sum of the source objects' values.
 * @param a
 * @param b
 */
function sumObjectValues(a: NumbersMap, b: NumbersMap): NumbersMap {
  return _.mapValues(a, (_, key) => a[key] + b[key]);
}

/**
 * Computes the weigted average of the given values. If the weights do not
 * add up to 1 the caller must adjust as appropriate.
 * @param values
 * @param weights
 */
function weightedAverage(values: number[], weights: number[]): number {
  return _.chain(_.zip(values, weights))
    .map(([value, weight]) => (value || 0) * (weight || 0))
    .sum()
    .value();
}
