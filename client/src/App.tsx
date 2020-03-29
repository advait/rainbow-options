import React, { useState } from "react";
import "./App.css";
import { defaultPortfolio, Portfolio } from "./portfolio";
import { makeStyles, Theme } from "@material-ui/core/styles";
import "typeface-roboto";
import { Contours } from "./contours";
import moment from "moment";
import { drawerWidth, LeftDrawer } from "./left-drawer";
import { useHistory, useParams } from "react-router-dom";
import { Navbar } from "./navbar";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: "flex",
  },
  content: {
    top: 0,
    right: 0,
    width: `calc(100% - ${drawerWidth}px)`,
    height: "100%",
    display: "flex",
    position: "fixed",
    overflowY: "hidden",
    padding: 0,
  },
}));

function App() {
  const classes = useStyles();

  // Parse portfolio from browser hash
  const history = useHistory();
  const urlParams: any = useParams();
  const setPortfolio = (portfolio: Portfolio, replace: boolean = false) => {
    const url = `/p/${portfolio.toURLSlug()}`;
    if (replace) {
      history.replace(url);
    } else {
      history.push(url);
    }
  };
  let portfolio;
  try {
    portfolio = Portfolio.fromURLSlug(urlParams.p);
  } catch (e) {
    console.log(
      "Failed to deserialize portfolio form hash, falling back to default portfolio."
    );
    portfolio = defaultPortfolio;
    setPortfolio(portfolio, true);
  }

  const [r, setR] = useState(0.007);
  const [mouseST, setMouseST] = useState({
    s: 0,
    t: moment(),
    mouseX: 0,
    mouseY: 0,
    show: false,
  });
  const [symbol, setSymbol] = useState("TEST");
  // TODO(advait): Allow us to modify the stock/time window via state
  const timeWindow = {
    t0: portfolio.entryTime,
    tFinal: portfolio.getEarliestExpiration(),
  };
  const stockPriceRange = 2 * portfolio.entryStockPrice;
  const stockPriceWindow = {
    yFinal: Math.max(0, portfolio.entryStockPrice - stockPriceRange),
    y0: portfolio.entryStockPrice + stockPriceRange,
  };

  const portfolioValue = portfolio.netValuePoint(mouseST.s, mouseST.t, r);

  return (
    <div className={classes.root}>
      <Navbar />
      <LeftDrawer
        portfolio={portfolio}
        setPortfolio={setPortfolio}
        r={r}
        setR={setR}
        symbol={symbol}
        setSymbol={setSymbol}
      />
      <main className={classes.content}>
        <Contours
          portfolio={portfolio}
          portfolioValue={portfolioValue}
          r={r}
          timeWindow={timeWindow}
          stockPriceWindow={stockPriceWindow}
          st={mouseST}
          setST={setMouseST}
        />
      </main>
    </div>
  );
}

export default App;
