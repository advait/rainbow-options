import {getExpirationDates} from "./ally";

export const resolvers = {
  Query: {
    stock: async (_, {symbol}) => {
      return { symbol };
    },
  },
  Stock: {
    expirations: async (parent) => {
      const expirations = await getExpirationDates(parent.symbol);
      return expirations.map(d => { return {date: d }});
    }
  },
  Expiration: {
    quotes: async (parent) => {
      return [];
    }
  }
};