import { GraphQLServer } from "graphql-yoga";
import { env } from "./env";
import { resolvers } from "./resolvers";
import * as supplementalTypes from "./supplementalTypes";
import { LruCache } from "graphql-resolver-cache";

const resolverCache = new LruCache();

const server = new GraphQLServer({
  typeDefs: "./src/schema.graphql",
  resolvers: {
    ...resolvers,
    ...supplementalTypes.resolvers,
  },
  context: {
    resolverCache,
  },
});

server.start(
  {
    tracing: true,
    port: env.port,
  },
  () => console.log(`Server is running on http://localhost:${env.port}`)
);
