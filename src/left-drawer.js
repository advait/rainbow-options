import {Drawer} from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import React from "react";
import {makeStyles} from '@material-ui/core/styles';

export const drawerWidth = 300;

const useStyles = makeStyles(theme => ({
  toolbar: theme.mixins.toolbar,
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
}));

export function LeftDrawer(props) {
  const classes = useStyles();

  return (<Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
  >
    <div className={classes.toolbar}/>

    <Divider/>
    <Typography variant="h6" className={classes.drawerTypography}>Portfolio Value</Typography>
    <Typography className={classes.drawerTypographySmall} color="textSecondary">Gains</Typography>
    <Typography
        className={classes.drawerTypographySmall}
        color="textPrimary">
      {(props.portfolioValue.pctGain * 100).toFixed(2)}%
    </Typography>
    <Typography className={classes.drawerTypographySmall} color="textSecondary">Initial Cost</Typography>
    <Typography
        className={classes.drawerTypographySmall}
        color="textPrimary">
      ${props.portfolio.entryCost.toFixed(2)}
    </Typography>
    <Typography className={classes.drawerTypographySmall} color="textSecondary">S</Typography>
    <Typography className={classes.drawerTypographySmall} color="textPrimary">${props.mouseST.s.toFixed(2)}</Typography>
    <Typography className={classes.drawerTypographySmall} color="textSecondary">T</Typography>
    <Typography
        className={classes.drawerTypographySmall}
        color="textPrimary">
      {props.mouseST.t.format('MMM D, YYYY')}
    </Typography>

    <Divider/>
    <Typography variant="h6" className={classes.drawerTypography}>Variables</Typography>
    <form className={classes.drawerTypography} noValidate autoComplete="off">
      <TextField
          label={"r (risk-free rate)"} fullWidth variant="filled"
          value={props.r}
          onChange={e => props.setR(parseFloat(e.target.value))}
      />
      <TextField
          label={"sigma (volatility)"} fullWidth variant="filled"
          value={props.sigma}
          onChange={e => props.setSigma(parseFloat(e.target.value))}
      />
    </form>
  </Drawer>);
}