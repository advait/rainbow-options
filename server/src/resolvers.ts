import {getExpirationDates, getOptionQuotes} from "./ally";
import {withCache} from "graphql-resolver-cache";

const CACHE_AGE_MS = 5 * 60 * 1000;

export const resolvers = {
  Query: {
    stock: (_, {symbol}) => {
      symbol = symbol.trim().toUpperCase();
      return {
        id: symbol,
        symbol,
      };
    },
  },
  Stock: {
    expirations: withCache(async (parent) => {
      const expirations = await getExpirationDates(parent.symbol);
      const ret = expirations.map(d => {
        const id = `${parent.id}:${d.format("YYYY-MM-DD")}`;
        return {
          id,
          stock: parent,
          date: d,
        }
      });
      return [ret[0]];
    }, {maxAge: CACHE_AGE_MS})
  },
  Expiration: {
    quotes: withCache(async (parent) => {
      const quotes = await getOptionQuotes(parent.stock.symbol, parent.date);
      return quotes.map(q => {
        const id = `${parent.id}:${q.putCall}:${q.strikePrice}`;
        return {
          id,
          ...q,
          expiration: parent,
        }
      })
    }, {maxAge: CACHE_AGE_MS})
  }
};

