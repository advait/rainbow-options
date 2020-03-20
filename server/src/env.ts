export type Env = {
  ally: {
    consumerKey: string,
    consumerSecret: string,
    oAuthToken: string,
    oAuthTokenSecret: string
  }
};

export const get: () => Env = () => ({
  ally: {
    consumerKey: envKeyOrFail("ALLY_CONSUMER_KEY"),
    consumerSecret: envKeyOrFail("ALLY_CONSUMER_SECRET"),
    oAuthToken: envKeyOrFail("OAUTH_TOKEN"),
    oAuthTokenSecret: envKeyOrFail("OAUTH_TOKEN_SECRET"),
  }
});

function envKeyOrFail(key: string): string {
  const ret = process.env[key];
  if (!ret) {
    throw new Error("Expected to receive environemnt variable: " + key);
  }
  return ret;
}
