import {getExpirationDates, getOptionQuotes} from "./ally";

export const resolvers = {
  Query: {
    stock: async (_, {symbol}) => {
      return {symbol};
    },
  },
  Stock: {
    expirations: async (parent) => {
      const expirations = await getExpirationDates(parent.symbol);
      const ret = expirations.map(d => {
        return {
          stock: parent,
          date: d,
        }
      });
      return [ret[0]];
    }
  },
  Expiration: {
    quotes: async (parent) => {
      const quotes = await getOptionQuotes(parent.stock.symbol, parent.date);
      return quotes.map(q => {
        return {
          ...q,
          expiration: parent,
        }
      })
    }
  }
};