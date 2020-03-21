import * as util from "util";
import * as oauth from "oauth";
import * as querystring from "querystring";
import {ParsedUrlQueryInput} from "querystring";
import {env} from "./env";
import * as moment from "moment";

const baseURL = "https://api.tradeking.com/v1";

const consumer = new oauth.OAuth(
    "https://developers.tradeking.com/oauth/request_token",
    "https://developers.tradeking.com/oauth/access_token",
    env.ally.consumerKey,
    env.ally.consumerSecret,
    "1.0",
    "http://mywebsite.com/tradeking/callback",
    "HMAC-SHA1");
consumer.getAsync = util.promisify(consumer.get.bind(consumer));


function allyRequest(path: string, params: ParsedUrlQueryInput = {}): Promise<any> {
  const url = baseURL + path + "?" + querystring.stringify(params);

  return consumer.getAsync(url, env.ally.oAuthToken, env.ally.oAuthTokenSecret)
      .then(data => {
        return JSON.parse(data).response;
      }, err => {
        console.warn("Failed Ally request", err);
        throw err;
      });
}

export async function getExpirationDates(symbol: string): Promise<Array<moment.Moment>> {
  const response = await allyRequest("/market/options/expirations.json", {
    symbol: symbol
  });
  return response.expirationdates.date.map(d => {
    return moment(d, "YYYY-MM-DD")
  });
}

export type OptionQuote = {
  putCall: string,
  strikePrice: number,
  bid: number,
  ask: number,
  last: number,
  impliedVolatility: number,
};

export async function getOptionQuotes(symbol: string, date: moment.Moment): Promise<OptionQuote[]> {
  const response = await allyRequest("/market/options/search.json", {
    symbol: symbol,
    query: `xdate-eq:${date.format("YYYYMMDD")}`,
  });
  return response.quotes.quote.map(input => {
    return {
      putCall: input.put_call.toUpperCase(),
      strikePrice: parseFloat(input.strikeprice),
      bid: parseFloat(input.bid),
      ask: parseFloat(input.ask),
      last: parseFloat(input.last),
      impliedVolatility: parseFloat(input.imp_Volatility),
    };
  });
}
