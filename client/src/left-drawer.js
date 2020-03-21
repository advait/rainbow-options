import {Drawer} from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import React from "react";
import {makeStyles} from '@material-ui/core/styles';
import ListItem from "@material-ui/core/ListItem";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import {LegType, portfolioEntryCost} from "./portfolio";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import {deepOrange, deepPurple, grey} from "@material-ui/core/colors";
import Avatar from "@material-ui/core/Avatar";
import moment from "moment";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";

export const drawerWidth = 300;

const drawerStyles = makeStyles(theme => ({
  toolbar: theme.mixins.toolbar,
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
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

export function LeftDrawer(props) {
  const classes = drawerStyles();

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
    <Typography variant="h6" className={classes.drawerTypography}>Portfolio</Typography>
    <Portfolio
        portfolio={props.portfolio}
        setPortfolio={props.setPortfolio}
    />
    <Typography className={classes.drawerTypographySmall} color="textSecondary">Entry Cost</Typography>
    <Typography
        className={classes.drawerTypographySmall}
        color="textPrimary">
      ${portfolioEntryCost(props.portfolio, props.r, props.sigma).toFixed(2)}
    </Typography>

    <Typography className={classes.drawerTypographySmall}/>
    <Divider/>
    <Typography variant="h6" className={classes.drawerTypography}>Variables</Typography>
    <form className={classes.drawerTypography} noValidate autoComplete="off">
      <TextField
          label={"r (risk-free rate)"} fullWidth variant="outlined"
          value={props.r}
          onChange={e => props.setR(parseFloat(e.target.value))}
      />
      <Typography className={classes.drawerTypographySmall}/>
      <TextField
          label={"sigma (volatility)"} fullWidth variant="outlined"
          value={props.sigma}
          onChange={e => props.setSigma(parseFloat(e.target.value))}
      />
    </form>
  </Drawer>);
}

const portfolioStyles = makeStyles(theme => ({
  orangeLong: {
    color: theme.palette.getContrastText(deepOrange[500]),
    backgroundColor: deepOrange[500],
  },
  orangeShort: {
    color: theme.palette.getContrastText(deepOrange[100]),
    backgroundColor: deepOrange[100],
  },
  purpleLong: {
    color: theme.palette.getContrastText(deepPurple[500]),
    backgroundColor: deepPurple[500],
  },
  purpleShort: {
    color: theme.palette.getContrastText(deepPurple[100]),
    backgroundColor: deepPurple[100],
  },
  grey: {
    color: theme.palette.getContrastText(grey[500]),
    backgroundColor: grey[500],
  },
}));

function Portfolio(props) {
  const classes = portfolioStyles();

  function renderLegAvatar(leg) {
    const r = (className, fullName, shortName) => (
        <Tooltip title={fullName}>
          <Avatar className={className}>{shortName}</Avatar>
        </Tooltip>
    );
    if (leg.quantity === 0) {
      return r(classes.grey, "None", "-");
    } else if (leg.quantity < 0 && leg.type === LegType.CALL) {
      return r(classes.orangeShort, "Short Call (Net Credit)", "CS");
    } else if (leg.quantity > 0 && leg.type === LegType.CALL) {
      return r(classes.orangeLong, "Long Call (Net Debit)", "CL");
    } else if (leg.quantity < 0 && leg.type === LegType.PUT) {
      return r(classes.purpleShort, "Short Put (Net Credit)", "PS");
    } else if (leg.quantity > 0 && leg.type === LegType.PUT) {
      return r(classes.purpleLong, "Long Put (Net Debit)", "PL");
    } else {
      throw new Error("Invalid leg: " + leg);
    }
  }

  const increaseStrikePrices = (portfolio => {
    return {
      ...portfolio,
      legs: portfolio.legs.map(leg => {
        return {
          ...leg,
          k: leg.k + 1,
        }
      }),
    };
  });

  const renderLeg = (leg) => (
      <ListItem button onClick={() => {
        props.setPortfolio(increaseStrikePrices(props.portfolio))
      }}>
        <ListItemIcon>
          {renderLegAvatar(leg)}
        </ListItemIcon>
        <ListItemText
            secondary={`${leg.t.format("MMM D, YYYY")} (${leg.t.diff(moment(), 'days')} days)`}
            primary={`${leg.quantity}x @ $${leg.k}`}
        />
        <ListItemSecondaryAction>
          <IconButton edge="end" aria-label="more">
            <MoreVertIcon/>
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
  );

  return (
      <List>
        {props.portfolio.legs.map(renderLeg)}
      </List>
  );
}
