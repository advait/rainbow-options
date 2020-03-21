import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {ApolloClient, gql} from "apollo-boost";
import {InMemoryCache} from "apollo-cache-inmemory";
import {HttpLink} from 'apollo-link-http';
import {ApolloProvider} from "@apollo/react-hooks";

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000'
  }),
  cache: new InMemoryCache(),
});

const Tree = () => (
    <ApolloProvider client={client}>
      <App/>
    </ApolloProvider>
);

ReactDOM.render(<Tree/>, document.getElementById('root'));
