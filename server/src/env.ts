import * as dotenv from "dotenv";

dotenv.config();

export type Env = {
  ally: {
    consumerKey: string,
    consumerSecret: string,
    oAuthToken: string,
    oAuthTokenSecret: string
  }
};

export const env: Env = {
  ally: {
    consumerKey: envKeyOrFail("ALLY_CONSUMER_KEY"),
    consumerSecret: envKeyOrFail("ALLY_CONSUMER_SECRET"),
    oAuthToken: envKeyOrFail("ALLY_OAUTH_TOKEN"),
    oAuthTokenSecret: envKeyOrFail("ALLY_OAUTH_TOKEN_SECRET"),
  }
};

function envKeyOrFail(key: string): string {
  const ret = process.env[key];
  if (!ret) {
    throw new Error("Expected to receive environment variable: " + key);
  }
  return ret;
}
