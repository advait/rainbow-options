import { ApolloProvider } from "@apollo/react-hooks";
import { ApolloClient } from "apollo-boost";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import moment from "moment";
import React from "react";

export const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:4000",
  }),
  cache: new InMemoryCache(),
});

export function wrapReact(tree: any) {
  return <ApolloProvider client={client}>{tree}</ApolloProvider>;
}

const DATE_FORMAT = "YYYY-MM-DD";

export function deserializeDate(s: string): moment.Moment {
  // TODO(advait): This should really be handled transparently by Apollo
  // Consider implementing: https://github.com/eturino/apollo-link-scalars?ts=2
  return moment(s, DATE_FORMAT);
}

export function serializeDate(d: moment.Moment): string {
  return d.format(DATE_FORMAT);
}
