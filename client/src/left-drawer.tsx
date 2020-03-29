import { Button, Drawer, Theme } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import AddIcon from "@material-ui/icons/Add";
import _ from "lodash";
import moment from "moment";
import React from "react";
import { OptionLegCard, PortfolioSummary } from "./option-leg-card";
import { Leg, Portfolio } from "./portfolio";
import { BlurInput } from "./util";

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
  addIconButton: {
    alignSelf: "flex-end",
    marginRight: theme.spacing(2),
  },
}));

export type LeftDrawerProps = {
  symbol: string;
  setSymbol: (symbol: string) => void;
  entryTime: moment.Moment;
  r: number;
  setR: (r: number) => void;
  portfolio: Portfolio;
  setPortfolio: (p: Portfolio) => void;
};

export function LeftDrawer(props: LeftDrawerProps) {
  const classes = drawerStyles();

  const setLeg = (legIndex: number) => (newLeg: Leg) => {
    const newLegs = _.clone(props.portfolio.legs);
    newLegs[legIndex] = newLeg;
    props.setPortfolio(props.portfolio.withNewLegs(newLegs));
  };
  const deleteLeg = (legIndex: number) => () => {
    if (props.portfolio.legs.length === 1) {
      return;
    }
    props.setPortfolio(
      props.portfolio.withNewLegs(
        props.portfolio.legs.filter((_, i) => i !== legIndex)
      )
    );
  };
  const addLeg = () => {
    const newLegs = _.clone(props.portfolio.legs);
    newLegs.push({
      ...props.portfolio.legs[props.portfolio.legs.length - 1],
    });
    props.setPortfolio(props.portfolio.withNewLegs(newLegs));
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
      <div className={classes.toolbar} />

      <Grid container className={classes.drawerTypography} spacing={2}>
        <Grid item xs={6}>
          <BlurInput
            label={"Stock Ticker"}
            fullWidth
            variant="outlined"
            value={props.symbol}
            setValue={props.setSymbol}
          />
        </Grid>
        <Grid item xs={6}>
          <BlurInput
            label="Stock Price"
            fullWidth
            variant="outlined"
            type="number"
            value={props.portfolio.entryStockPrice.toFixed(2)}
            setValue={(newStockPrice: string) => {
              props.setPortfolio(
                new Portfolio(
                  props.portfolio.legs,
                  props.portfolio.entryTime,
                  parseFloat(newStockPrice)
                )
              );
            }}
          />
        </Grid>
      </Grid>

      <Typography className={classes.drawerTypographySmall} />
      <Divider />

      <Typography variant="h6" className={classes.drawerTypography}>
        Options Legs
      </Typography>
      {props.portfolio.legs.map((leg: Leg, i: number) => (
        <OptionLegCard
          entryStockPrice={props.portfolio.entryStockPrice}
          entryTime={props.entryTime}
          r={props.r}
          leg={leg}
          setLeg={setLeg(i)}
          deleteLeg={deleteLeg(i)}
        />
      ))}

      <Button
        variant="text"
        startIcon={<AddIcon />}
        className={classes.addIconButton}
        onClick={addLeg}
      >
        Add Leg
      </Button>

      <PortfolioSummary r={props.r} portfolio={props.portfolio} />

      <Typography className={classes.drawerTypographySmall} />
      <Divider />

      <Typography variant="h6" className={classes.drawerTypography}>
        Variables
      </Typography>
      <form className={classes.drawerTypography} noValidate autoComplete="off">
        <BlurInput
          label={"r (risk-free rate)"}
          fullWidth
          variant="outlined"
          type="number"
          value={`${props.r}`}
          setValue={(r) => props.setR(parseFloat(r))}
        />
      </form>
    </Drawer>
  );
}
