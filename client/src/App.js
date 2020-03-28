import React, { useState } from "react";
import "./App.css";
import { defaultPortfolio, Portfolio } from "./portfolio";
import { makeStyles } from "@material-ui/core/styles";
import { AppBar, Icon, IconButton, Toolbar } from "@material-ui/core";
import "typeface-roboto";
import GitHubIcon from "@material-ui/icons/GitHub";
import Link from "@material-ui/core/Link";
import LooksIcon from "@material-ui/icons/Looks";
import { Contours } from "./contours";
import moment from "moment";
import { drawerWidth, LeftDrawer } from "./left-drawer";
import { useHistory, useParams } from "react-router-dom";
import * as _ from "lodash";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  titleLink: {
    color: "#FFF",
  },
  toolbar: theme.mixins.toolbar,
  menuButton: {
    marginRight: theme.spacing(2),
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
  const urlParams = useParams();
  const setPortfolio = (portfolio, replace = false) => {
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
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Icon edge="start" className={classes.menuButton}>
            <Link href="/" underline="none" className={classes.titleLink}>
              <LooksIcon />
            </Link>
          </Icon>
          <Link
            href="/"
            underline="none"
            variant="h6"
            className={classes.titleLink}
          >
            Rainbow Options Calculator
          </Link>
          <div style={{ flexGrow: 1 }} />
          <div>
            <IconButton
              aria-label="link to github"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              color="inherit"
            >
              <Link
                href="https://github.com/advait/rainbow-options"
                className={classes.titleLink}
                target="_blank"
              >
                <GitHubIcon />
              </Link>
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
      <LeftDrawer
        portfolio={portfolio}
        setPortfolio={setPortfolio}
        portfolioValue={portfolioValue}
        r={r}
        setR={setR}
        timeWindow={timeWindow}
        symbol={symbol}
        setSymbol={setSymbol}
        mouseST={mouseST}
        setST={setMouseST}
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
