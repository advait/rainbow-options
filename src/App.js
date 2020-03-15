import React, {useState} from "react";
import "./App.css";
import {portfolioValuePoint} from "./blackscholes";
import * as Portfolio from "./portfolio";
import {makeStyles} from '@material-ui/core/styles';
import {AppBar, Drawer, Icon, IconButton, Toolbar} from '@material-ui/core';
import 'typeface-roboto';
import Divider from "@material-ui/core/Divider";
import GitHubIcon from '@material-ui/icons/GitHub';
import Link from "@material-ui/core/Link";
import LooksIcon from '@material-ui/icons/Looks';
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import {Contours} from "./contours";
import moment from "moment";

const drawerWidth = 300;

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
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerTypography: {
    padding: theme.spacing(2),
  },
  drawerTypographySmall: {
    paddingBottom: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
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

function App() {
  const classes = useStyles();

  const [r, setR] = useState(0.007);
  const [sigma, setSigma] = useState(0.9);
  const [portfolio, setPortfolio] = useState(Portfolio.portfolio);
  const [mouseST, setMouseST] = useState({s: 550, t: moment(), mouseX: 0, mouseY: 0, show: false});
  const [timeWindow, setTimeWIndow] = useState({t0: moment(), tFinal: moment().add(1, 'year')})

  const portfolioValue = portfolioValuePoint(mouseST.s, mouseST.t, portfolio, r, sigma);

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
                <Link href="https://www.github.com/" className={classes.titleLink} target="_blank">
                  <GitHubIcon/>
                </Link>
              </IconButton>
            </div>
          </Toolbar>
        </AppBar>
        <Drawer
            className={classes.drawer}
            variant="permanent"
            classes={{
              paper: classes.drawerPaper,
            }}
            anchor="left"
        >
          <div className={classes.toolbar}/>
          <Divider />
          <Typography variant="h6" className={classes.drawerTypography}>Portfolio Value</Typography>
          <Typography className={classes.drawerTypographySmall} color="textSecondary">Gains</Typography>
          <Typography className={classes.drawerTypographySmall} color="textPrimary">{(portfolioValue.pctGain * 100).toFixed(2)}%</Typography>
          <Typography className={classes.drawerTypographySmall} color="textSecondary">Initial Cost</Typography>
          <Typography className={classes.drawerTypographySmall} color="textPrimary">${portfolio.entryCost.toFixed(2)}</Typography>
          <Typography className={classes.drawerTypographySmall} color="textSecondary">S</Typography>
          <Typography className={classes.drawerTypographySmall} color="textPrimary">${mouseST.s.toFixed(2)}</Typography>
          <Typography className={classes.drawerTypographySmall} color="textSecondary">T</Typography>
          <Typography className={classes.drawerTypographySmall} color="textPrimary">{mouseST.t.format('MMM D, YYYY')}</Typography>
          <Divider/>
          <Typography variant="h6" className={classes.drawerTypography}>Variables</Typography>
          <form className={classes.drawerTypography} noValidate autoComplete="off">
            <TextField
                label={"r (risk-free rate)"} fullWidth variant="filled"
                value={r}
                onChange={e => setR(parseFloat(e.target.value))}
            />
            <TextField
                label={"sigma (volatility)"} fullWidth variant="filled"
                value={sigma}
                onChange={e => setSigma(parseFloat(e.target.value))}
            />
          </form>
        </Drawer>
        <main className={classes.content}>
          <Contours portfolio={portfolio} portfolioValue={portfolioValue} r={r} sigma={sigma} timeWindow={timeWindow} st={mouseST} setST={setMouseST}/>
        </main>
      </div>
  );
}


export default App;
