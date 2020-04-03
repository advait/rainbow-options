import * as dotenv from "dotenv";

dotenv.config();

export type Env = {
  ally: {
    consumerKey: string;
    consumerSecret: string;
    oAuthToken: string;
    oAuthTokenSecret: string;
  };
};

export const env = {
  ally: {
    consumerKey: envKeyOrFail("ALLY_CONSUMER_KEY"),
    consumerSecret: envKeyOrFail("ALLY_CONSUMER_SECRET"),
    oAuthToken: envKeyOrFail("ALLY_OAUTH_TOKEN"),
    oAuthTokenSecret: envKeyOrFail("ALLY_OAUTH_TOKEN_SECRET"),
  },
  port: parseInt(envKeyOrFail("PORT", "4000")),
};

function envKeyOrFail(key: string, def: string = undefined): string {
  const ret = process.env[key] || def;
  if (!ret) {
    throw new Error("Expected to receive environment variable: " + key);
  }
  return ret;
}
