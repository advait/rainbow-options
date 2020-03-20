import {GraphQLServer} from 'graphql-yoga'
import {getExpirations, getStrikes} from "./ally";

const typeDefs = `
  type Query {
    hello(name: String): String
    stock(symbol: String): Stock
  }
  
  type Stock {
    symbol: String!
    expirations: [String!]
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name }) => {
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

const server = new GraphQLServer({
  typeDefs,
  resolvers
});

server.start(() => console.log('Server is running on http://localhost:4000'));
