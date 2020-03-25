import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {wrapReact} from "./graphql";

ReactDOM.render(wrapReact(<App/>), document.getElementById("root"));
