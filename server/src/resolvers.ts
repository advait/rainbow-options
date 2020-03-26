import { withCache } from "graphql-resolver-cache";
import {
  getExpirationDates,
  getOptionQuotes,
  getStockQuote,
  OptionQuote,
  StockQuote,
} from "./ally";
import moment = require("moment");

const CACHE_AGE_MS = 5 * 60 * 1000;

export const resolvers = {
  Query: {
    stock: (_, { symbol }) => {
      return ResultStock(symbol);
    },
    expiration: (_, { symbol, date }) => {
      return ResultExpiration(ResultStock(symbol), date);
    },
  },
  Stock: {
    quote: withCache(
      async (parent) => {
        const quote = await getStockQuote(parent.symbol);
        return ResultStockQuote(parent, quote);
      },
      { maxAge: CACHE_AGE_MS }
    ),
    expirations: withCache(
      async (parent) => {
        const expirations = await getExpirationDates(parent.symbol);
        return expirations.map((d) => ResultExpiration(parent, d));
      },
      { maxAge: CACHE_AGE_MS }
    ),
  },
  Expiration: {
    quotes: withCache(
      async (parent) => {
        const quotes = await getOptionQuotes(parent.stock.symbol, parent.date);
        return quotes.map((q) => ResultOptionQuote(parent, q));
      },
      { maxAge: CACHE_AGE_MS }
    ),
  },
};

type ResultStock = {
  id: string;
  symbol: string;
};

function ResultStock(symbol: string): ResultStock {
  symbol = symbol.trim().toUpperCase();
  return {
    id: symbol,
    symbol,
  };
}

interface ResultStockQuote extends StockQuote {
  stock: ResultStock;
  id: string;
}

function ResultStockQuote(
  stock: ResultStock,
  quote: StockQuote
): ResultStockQuote {
  return {
    stock,
    id: stock.id,
    ...quote,
  };
}

type ResultExpiration = {
  id: string;
  stock: ResultStock;
  date: moment.Moment;
};

function ResultExpiration(
  stock: ResultStock,
  date: moment.Moment
): ResultExpiration {
  const id = `${stock.id}:${date.format("YYYY-MM-DD")}`;
  return {
    id,
    stock,
    date,
  };
}

interface ResultOptionQuote extends OptionQuote {
  id: string;
  expiration: ResultExpiration;
}

function ResultOptionQuote(
  expiration: ResultExpiration,
  quote: OptionQuote
): ResultOptionQuote {
  const id = `${expiration.id}:${quote.putCall}:${quote.strikePrice}`;
  return {
    id,
    expiration,
    ...quote,
  };
}
