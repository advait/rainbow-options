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
import {CALL} from "./portfolio";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import {deepOrange, deepPurple} from "@material-ui/core/colors";
import Avatar from "@material-ui/core/Avatar";
import moment from "moment";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";

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
    />
    <Typography className={classes.drawerTypographySmall} color="textSecondary">Entry Cost</Typography>
    <Typography
        className={classes.drawerTypographySmall}
        color="textPrimary">
      ${props.portfolio.entryCost.toFixed(2)}
    </Typography>
    <Typography className={classes.drawerTypographySmall} color="textSecondary">IV</Typography>
    <Typography
        className={classes.drawerTypographySmall}
        color="textPrimary">
      ???
    </Typography>

    <Typography className={classes.drawerTypographySmall} />
    <Divider/>
    <Typography variant="h6" className={classes.drawerTypography}>Portfolio Value</Typography>
    <Typography className={classes.drawerTypographySmall} color="textSecondary">S</Typography>
    <Typography className={classes.drawerTypographySmall} color="textPrimary">${props.mouseST.s.toFixed(2)}</Typography>
    <Typography className={classes.drawerTypographySmall} color="textSecondary">T</Typography>
    <Typography
        className={classes.drawerTypographySmall}
        color="textPrimary">
      {props.mouseST.t.format('MMM D, YYYY')}
    </Typography>

    <Typography className={classes.drawerTypographySmall} />
    <Divider/>
    <Typography variant="h6" className={classes.drawerTypography}>Variables</Typography>
    <form className={classes.drawerTypography} noValidate autoComplete="off">
      <TextField
          label={"r (risk-free rate)"} fullWidth variant="filled"
          value={props.r}
          onChange={e => props.setR(parseFloat(e.target.value))}
      />
      <Typography className={classes.drawerTypographySmall} />
      <TextField
          label={"sigma (volatility)"} fullWidth variant="filled"
          value={props.sigma}
          onChange={e => props.setSigma(parseFloat(e.target.value))}
      />
    </form>
  </Drawer>);
}

const portfolioStyles = makeStyles(theme => ({
  orange: {
    color: theme.palette.getContrastText(deepOrange[500]),
    backgroundColor: deepOrange[500],
  },
  purple: {
    color: theme.palette.getContrastText(deepPurple[500]),
    backgroundColor: deepPurple[500],
  },
}));

function Portfolio(props) {
  const classes = portfolioStyles();

  const renderLeg = (leg) => {
    return (
        <ListItem button>
          <ListItemIcon>
            {leg.type === CALL
                ? <Avatar className={classes.orange} alt="Long Call">LC</Avatar>
                : <Avatar className={classes.purple}>P</Avatar>
            }
          </ListItemIcon>
          <ListItemText
              secondary={`${leg.t.format("MMM D, YYYY")} (${leg.t.diff(moment(), 'days')} days)`}
              primary={`${leg.quantity}x @ $${leg.k}`}
          />
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="more">
              <MoreVertIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
    );
  };

  return (
      <List>
        {props.portfolio.legs.map(renderLeg)}
      </List>

  );
}