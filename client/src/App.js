import React, {useState} from "react";
import "./App.css";
import {portfolioNetValuePoint} from "./blackscholes";
import * as Portfolio from "./portfolio";
import {getEarliestExpiration} from "./portfolio";
import {makeStyles} from '@material-ui/core/styles';
import {AppBar, Icon, IconButton, Toolbar} from '@material-ui/core';
import 'typeface-roboto';
import GitHubIcon from '@material-ui/icons/GitHub';
import Link from "@material-ui/core/Link";
import LooksIcon from '@material-ui/icons/Looks';
import {Contours} from "./contours";
import moment from "moment";
import {drawerWidth, LeftDrawer} from "./left-drawer";


const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  titleLink: {
    color: '#FFF',
  },
  toolbar: theme.mixins.toolbar,
  menuButton: {
    marginRight: theme.spacing(2),
  },
  content: {
    top: 0,
    right: 0,
    width: `calc(100% - ${drawerWidth}px)`,
    height: '100%',
    display: 'flex',
    position: 'fixed',
    overflowY: 'hidden',
    padding: 0,
  },
}));

function App(props) {
  const classes = useStyles();

  const [r, setR] = useState(0.007);
  const [sigma, setSigma] = useState(0.87);
  const [portfolio, setPortfolio] = useState(Portfolio.portfolio);
  const [mouseST, setMouseST] = useState({s: 0, t: moment(), mouseX: 0, mouseY: 0, show: false});
  const [timeWindow, setTimeWindow] = useState({t0: moment(), tFinal: getEarliestExpiration(portfolio)});
  const [entryStockPrice, setEntryStockPrice] = useState(5);

  const portfolioValue = portfolioNetValuePoint(entryStockPrice, mouseST.s, mouseST.t, portfolio, r, sigma);

  return (
      <div className={classes.root}>
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <Icon edge="start" className={classes.menuButton}>
              <Link href="/" underline='none' className={classes.titleLink}>
                <LooksIcon/>
              </Link>
            </Icon>
            <Link href="/" underline='none' variant="h6" className={classes.titleLink}>
              Rainbow Options Calculator
            </Link>
            <div style={{flexGrow: 1}}/>
            <div>
              <IconButton
                  aria-label="link to github"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  color="inherit">
                <Link href="https://github.com/advait/rainbow-options" className={classes.titleLink} target="_blank">
                  <GitHubIcon/>
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
            sigma={sigma}
            setSigma={setSigma}
            timeWindow={timeWindow}
            entryStockPrice={entryStockPrice}
            setEntryStockPrice={setEntryStockPrice}
            mouseST={mouseST}
            setST={setMouseST}
        />
        <main className={classes.content}>
          <Contours
              portfolio={portfolio}
              portfolioValue={portfolioValue}
              r={r}
              sigma={sigma}
              timeWindow={timeWindow}
              entryStockPrice={entryStockPrice}
              setEntryStockPrice={setEntryStockPrice}
              st={mouseST}
              setST={setMouseST}
          />
        </main>
      </div>
  );
}

export default App;
