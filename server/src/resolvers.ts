import {getExpirations} from "./ally";

export const resolvers = {
  Query: {
    hello: (_, {name}) => {
      return `Hello ${name || 'World!'}`;
    },
    stock: async (_, {symbol}) => {
      const expirations = await getExpirations(symbol);
      return {
        symbol,
        expirations: expirations,
      }
    },
  }
};