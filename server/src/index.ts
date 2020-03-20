import {GraphQLServer} from 'graphql-yoga'
import {resolvers} from "./resolvers";
import * as supplementalTypes from "./supplementalTypes";

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers: {
    ...resolvers,
    ...supplementalTypes.resolvers
  },
});

server.start(() => console.log('Server is running on http://localhost:4000'));
