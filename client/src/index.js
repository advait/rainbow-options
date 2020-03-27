import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { wrapReact } from "./graphql";
import { HashRouter, Switch, Route } from "react-router-dom";

ReactDOM.render(
  wrapReact(
    <HashRouter>
      <Switch>
        <Route path="/p/:p">
          <App />
        </Route>
        <Route>
          <App />
        </Route>
      </Switch>
    </HashRouter>
  ),
  document.getElementById("root")
);
