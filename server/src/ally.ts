import * as crypto from "crypto";
import * as util from "util";
import * as oauth from "oauth";
import * as request from "request";
import * as querystring from "querystring";
import {env} from "./env";
import {ParsedUrlQueryInput} from "querystring";

const baseURL = "https://api.tradeking.com/v1/";

const config = {
  api_url: "https://api.tradeking.com/v1",
  consumer_key: env.ally.consumerKey,
  consumer_secret: env.ally.consumerSecret,
  access_token: env.ally.oAuthToken,
  access_secret: env.ally.oAuthTokenSecret,
};

const consumer = new oauth.OAuth(
    "https://developers.tradeking.com/oauth/request_token",
    "https://developers.tradeking.com/oauth/access_token",
    config.consumer_key,
    config.consumer_secret,
    "1.0",
    "http://mywebsite.com/tradeking/callback",
    "HMAC-SHA1");
consumer.getAsync = util.promisify(consumer.get.bind(consumer));


function allyRequest(path: string, params: ParsedUrlQueryInput = {}): Promise<any> {
  const url = config.api_url + path + "?" + querystring.stringify(params);

  return consumer.getAsync(url, config.access_token, config.access_secret)
      .then(data => {
        return JSON.parse(data).response;
      }, err => {
        console.warn("Failed Ally request", err);
        throw err;
      });
}

export function getStrikes(symbol: string) {
  return allyRequest("/market/options/strikes.json", {
    symbol: symbol
  });
}

export async function getExpirations(symbol: string): Promise<string[]> {
  const response = await allyRequest("/market/options/expirations.json", {
    symbol: symbol
  });
  return response.expirationdates.date;
}
