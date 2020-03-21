import {getExpirationDates, getOptionQuotes, OptionQuote} from "./ally";
import {withCache} from "graphql-resolver-cache";
import moment = require("moment");

const CACHE_AGE_MS = 5 * 60 * 1000;

export const resolvers = {
  Query: {
    stock: (_, {symbol}) => {
      return ResultStock(symbol);
    },
    expiration: (_, {symbol, date}) => {
      return ResultExpiration(ResultStock(symbol), date);
    }
  },
  Stock: {
    expirations: withCache(async (parent) => {
      const expirations = await getExpirationDates(parent.symbol);
      const ret = expirations.map(d => ResultExpiration(parent, d));
      return [ret[0]];
    }, {maxAge: CACHE_AGE_MS})
  },
  Expiration: {
    quotes: withCache(async (parent) => {
      const quotes = await getOptionQuotes(parent.stock.symbol, parent.date);
      return quotes.map(q => ResultQuote(parent, q));
    }, {maxAge: CACHE_AGE_MS})
  }
};

type ResultStock = {
  id: string,
  symbol: string,
}

function ResultStock(symbol: string): ResultStock {
  symbol = symbol.trim().toUpperCase();
  return {
    id: symbol,
    symbol,
  };
}

type ResultExpiration = {
  id: string,
  stock: ResultStock,
  date: moment.Moment
}

function ResultExpiration(stock: ResultStock, date: moment.Moment): ResultExpiration {
  const id = `${stock.id}:${date.format("YYYY-MM-DD")}`;
  return {
    id,
    stock,
    date,
  }
}

interface ResultQuote extends OptionQuote {
  id: string,
  expiration: ResultExpiration,
}

function ResultQuote(expiration: ResultExpiration, q: OptionQuote): ResultQuote {
  const id = `${expiration.id}:${q.putCall}:${q.strikePrice}`;
  return {
    id,
    expiration,
    ...q,
  }
}
