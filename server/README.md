# Rainbow Options - GraphQL Server

GraphQL backend for serving options quotes.

## Features

- **Ally Invest API:** Wraps the [Ally Invest/Tradeking API](https://www.ally.com/api/invest/documentation/getting-started/)
- **Scalable GraphQL server:** The server uses [`graphql-yoga`](https://github.com/prisma/graphql-yoga) which is based on Apollo Server & Express
- **Tooling**: Out-of-the-box support for [GraphQL Playground](https://github.com/prisma/graphql-playground) & [query performance tracing](https://github.com/apollographql/apollo-tracing)

## Getting started

To run this server locally, you need an [Ally Invest API account](https://www.ally.com/api/invest/documentation/getting-started/). 
Once you have an account, create a file called `.env` and populate it with the following
 environment variables:
 ```
touch .env
```
 ```
ALLY_CONSUMER_KEY="{Insert Here}"
ALLY_CONSUMER_SECRET="{Insert Here}"
ALLY_OAUTH_TOKEN="{Insert Here}"
ALLY_OAUTH_TOKEN_SECRET="{Insert Here}"
```

Next install dependencies and run the server:

```sh
yarn install

# Start server (runs on http://localhost:4000) and open GraphQL Playground
yarn dev
```

Navigate to http://localhost:4000 to see the GraphQL Playground:
![](https://imgur.com/hElq68i.png)
