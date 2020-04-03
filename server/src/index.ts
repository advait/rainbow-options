import * as express from "express";
import { LruCache } from "graphql-resolver-cache";
import { GraphQLServer } from "graphql-yoga";
import * as path from "path";
import { env } from "./env";
import { resolvers } from "./resolvers";
import * as supplementalTypes from "./supplementalTypes";

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

// Setup static file serving
server.use(
  "/rainbow-options",
  express.static(path.join(__dirname, "../build"))
);
server.express.get("*", (req, res, next) => {
  // Handle graphql-yoga specific routes
  if (req.url == "/") {
    res.sendFile(path.join(__dirname, "../build/index.html"));
  } else {
    // Return next() so that the GraphQLServer or static handler can handle
    return next();
  }
});

server.start(
  {
    tracing: true,
    port: env.port,
    endpoint: "/graphql",
    playground: env.nodeEnv === "production" ? false : "/playground",
    subscriptions: false,
  },
  () => console.log(`Server is running on http://localhost:${env.port}`)
);
