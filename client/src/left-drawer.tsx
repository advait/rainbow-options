import {Button, Card, Drawer, Theme} from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import {makeStyles} from '@material-ui/core/styles';
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import _ from "lodash";
import React from "react";
import {OptionLegCard, PortfolioSummary} from "./option-leg-card";
import {Leg, Portfolio, portfolioEntryCost} from "./portfolio";

export const drawerWidth = 350;

// @ts-ignore
const drawerStyles = makeStyles((theme: Theme) => ({
  toolbar: theme.mixins.toolbar,
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    overflowX: "hidden",
  },
  drawerPaper: {
    width: drawerWidth,
    overflowX: "hidden",
  },
  drawerTypography: {
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  drawerTypographySmall: {
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

export type LeftDrawerProps = {
  symbol: string,
  setSymbol: (symbol: string) => void,
  entryStockPrice: number,
  setEntryStockPrice: (s: number) => void,
  r: number,
  setR: (r: number) => void,
  portfolio: Portfolio,
  setPortfolio: (p: Portfolio) => void,
}

export function LeftDrawer(props: LeftDrawerProps) {
  const classes = drawerStyles();

  const setLeg = (legIndex: number) => (newLeg: Leg) => {
    const newPortfolio = _.cloneDeep(props.portfolio);
    newPortfolio.legs[legIndex] = newLeg;
    props.setPortfolio(newPortfolio);
  };
  const deleteLeg = (legIndex: number) => () => {
    if (props.portfolio.legs.length === 1) {
      return;
    }
    const newPortfolio = _.cloneDeep(props.portfolio);
    newPortfolio.legs = newPortfolio.legs.filter((_, i) => i !== legIndex);
    props.setPortfolio(newPortfolio);
  };

  return (
      <Drawer
          className={classes.drawer}
          variant="permanent"
          classes={{
            paper: classes.drawerPaper,
          }}
          anchor="left"
      >
        <div className={classes.toolbar}/>

        <Grid container className={classes.drawerTypography} spacing={2}>
          <Grid item xs={6}>
            <TextField
                label={"Stock Ticker"} fullWidth variant="outlined"
                value={props.symbol}
                onChange={(e) => props.setSymbol(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
                label={"Price"} fullWidth variant="outlined"
                value={props.entryStockPrice.toFixed(2)}
                type="number"
                onChange={(e) => props.setEntryStockPrice(parseFloat(e.target.value))}
            />
          </Grid>
        </Grid>

        <Typography className={classes.drawerTypographySmall}/>
        <Divider/>

        <Typography variant="h6" className={classes.drawerTypography}>Options Legs</Typography>
        {props.portfolio.legs.map((leg: Leg, i: number) =>
            <OptionLegCard
                entryStockPrice={props.entryStockPrice}
                r={props.r}
                leg={leg}
                setLeg={setLeg(i)}
                deleteLeg={deleteLeg(i)}
            />)
        }

        <PortfolioSummary
            entryStockPrice={props.entryStockPrice}
            r={props.r}
            portfolio={props.portfolio}
        />

        <Typography className={classes.drawerTypographySmall}/>
        <Divider/>
        <Typography variant="h6" className={classes.drawerTypography}>Variables</Typography>
        <form className={classes.drawerTypography} noValidate autoComplete="off">
          <TextField
              label={"r (risk-free rate)"} fullWidth variant="outlined"
              value={props.r}
              type="number"
              onChange={e => props.setR(parseFloat(e.target.value))}
          />
          />
        </form>
      </Drawer>);
}
