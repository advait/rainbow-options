import {Drawer, Theme} from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import {makeStyles} from '@material-ui/core/styles';
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import React from "react";
import {OptionLegCard} from "./option-leg-card";
import {Leg, portfolioEntryCost} from "./portfolio";

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

export function LeftDrawer(props: any) {
  const classes = drawerStyles();

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
        {props.portfolio.legs.map((leg: Leg) => <OptionLegCard leg={leg}/>)}

        <Typography className={classes.drawerTypographySmall} color="textSecondary">Entry Cost</Typography>
        <Typography
            className={classes.drawerTypographySmall}
            color="textPrimary">
          ${portfolioEntryCost(props.entryStockPrice, props.portfolio, props.r, props.sigma).toFixed(2)}
        </Typography>

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
          <Typography className={classes.drawerTypographySmall}/>
          <TextField
              label={"sigma (volatility)"} fullWidth variant="outlined"
              value={props.sigma}
              type="number"
              onChange={e => props.setSigma(parseFloat(e.target.value))}
          />
        </form>
      </Drawer>);
}
