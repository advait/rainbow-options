import {Avatar, Box, Button, ButtonGroup, Card, CardHeader, Collapse, Theme, Tooltip} from "@material-ui/core";
import {deepOrange, deepPurple, grey} from "@material-ui/core/colors";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import {makeStyles} from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import clsx from 'clsx';
import moment from "moment";
import React, {useState} from "react";
import {Leg, PutCall} from "./portfolio";

// @ts-ignore

const optionLegStyles = makeStyles((theme: Theme) => ({
  card: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    overflow: "visible",
  },
  cardHeader: {
    cursor: "pointer",
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  contentRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    justifyContent: "space-between",
  },
  largeButtonGroup: {
    marginTop: theme.spacing(2),
    flexGrow: 1,
  },
  largeButton: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  smallButtonGroup: {
    marginRight: theme.spacing(2),
  },
  smallButton: {
    padding: 0,
    margin: 0,
    minWidth: "24px",
  },
  descriptionValueParent: {
    display: "flex",
    flexGrow: 1,
    flexDirection: "column",
  },
  description: {
    fontSize: "12px",
    color: grey[500],
    marginTOp: "-2px",
    marginBottom: "3px",
  },
  value: {
    fontSize: "18px",
  },
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


export type OptionLegCardProps = {
  leg: Partial<Leg>,
}

export function OptionLegCard(props: OptionLegCardProps) {
  const classes = optionLegStyles();
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);

  function cond<T>(test: T | undefined, und: string, other: (t: T) => string): string {
    if (test === undefined) {
      return und;
    } else {
      return other(test);
    }
  }

  const quantityStr = cond(props.leg.quantity, "-", q => q > 0 ? `+${q}` : `${q}`);
  const putCallStr = cond(props.leg.putCall, "?", pc => pc === PutCall.CALL ? "Call" : "Put");
  const longShortStr = cond(props.leg.quantity, "Long", q => q < 0 ? "Short" : "Long");
  const avatarStr = `${putCallStr[0]}${longShortStr[0]}`;
  const strikeStr = cond(props.leg.k, "?", k => `$${k}`);
  const exprStr = cond(props.leg.t, "?", t => `${t.format("MMM DD, YYYY")} (${t.diff(moment(), "days")} days)`);
  let callButtonClass = "";
  if (props.leg.putCall === PutCall.CALL) {
    callButtonClass = (props.leg.quantity && props.leg.quantity < 0) ? classes.orangeShort : classes.orangeLong;
  }
  let putButtonClass = "";
  if (props.leg.putCall === PutCall.PUT) {
    putButtonClass = (props.leg.quantity && props.leg.quantity < 0) ? classes.purpleShort : classes.purpleLong;
  }

  return (
      <Card elevation={1} className={classes.card}>
        <CardHeader
            avatar={
              <Tooltip title={`${longShortStr} ${putCallStr}`}>
                <Avatar className={clsx(putButtonClass, callButtonClass)}>{avatarStr}</Avatar>
              </Tooltip>
            }
            title={`${quantityStr}x @ ${strikeStr} ${putCallStr}`}
            subheader={`${exprStr}`}
            action={<IconButton className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}><ExpandMoreIcon/></IconButton>}
            onClick={toggleExpanded}
            className={classes.cardHeader}
        />

        <Collapse in={expanded} timeout="auto">
          <Divider/>
          <Box flexDirection="row" className={classes.contentRow}>
            <ButtonGroup orientation="horizontal" variant="outlined" className={classes.largeButtonGroup}>
              <Button
                  className={clsx(classes.largeButton, callButtonClass)}>{props.leg.quantity && props.leg.quantity < 0 ? "Short" : "Long"} Call</Button>
              <Button
                  className={clsx(classes.largeButton, putButtonClass)}>{props.leg.quantity && props.leg.quantity < 0 ? "Short" : "Long"} Put</Button>
            </ButtonGroup>
            <IconButton edge="end"><DeleteIcon/></IconButton>
          </Box>

          <Box flexDirection="row" className={classes.contentRow}>
            <ButtonGroup orientation="vertical" variant="outlined" className={classes.smallButtonGroup}>
              <Button size="small" className={classes.smallButton}>+</Button>
              <Button size="small" className={classes.smallButton}>-</Button>
            </ButtonGroup>
            <div className={classes.descriptionValueParent}>
            <span className={classes.description}>
              Expiration
            </span>
              <span className={classes.value}>
                {props.leg.t
                    ?
                    <React.Fragment>{props.leg.t.format("MMM DD, YY")} ({props.leg.t.diff(moment(), "days")} days)</React.Fragment>
                    : "Unknown"
                }
              </span>
            </div>
            <IconButton edge="end"><EditIcon/></IconButton>
          </Box>

          <Box flexDirection="row" className={classes.contentRow}>
            <ButtonGroup orientation="vertical" variant="outlined" className={classes.smallButtonGroup}>
              <Button size="small" className={classes.smallButton}>+</Button>
              <Button size="small" className={classes.smallButton}>-</Button>
            </ButtonGroup>
            <div className={classes.descriptionValueParent} style={{width: "65px"}}>
              <span className={classes.description}>
                Quantity
              </span>
              <span className={classes.value}>
              {props.leg.quantity ? props.leg.quantity : "?"}
              </span>
            </div>
            <ButtonGroup orientation="vertical" variant="outlined" className={classes.smallButtonGroup}>
              <Button size="small" className={classes.smallButton}>+</Button>
              <Button size="small" className={classes.smallButton}>-</Button>
            </ButtonGroup>
            <div className={classes.descriptionValueParent}>
              <span className={classes.description}>
                Strike Price
              </span>
              <span className={classes.value}>
                ${props.leg.k ? props.leg.k.toFixed(2) : "?"}
              </span>
            </div>
            <IconButton edge="end"><EditIcon/></IconButton>
          </Box>

          <Box flexDirection="row" className={classes.contentRow}>
            <ButtonGroup orientation="vertical" variant="outlined" className={classes.smallButtonGroup}>
              <Button size="small" className={classes.smallButton}>+</Button>
              <Button size="small" className={classes.smallButton}>-</Button>
            </ButtonGroup>
            <div className={classes.descriptionValueParent} style={{width: "60px"}}>
              <span className={classes.description}>
                Unit Price
              </span>
              <span className={classes.value}>
                ${props.leg.k ? props.leg.k.toFixed(2) : "?"}
              </span>
            </div>
            <div className={classes.descriptionValueParent}>
              <span className={classes.description}>
                Implied Volatility
              </span>
              <span className={classes.value}>
                ${props.leg.k ? props.leg.k.toFixed(2) : "?"}
              </span>
            </div>
            <IconButton edge="end"><EditIcon/></IconButton>
          </Box>
        </Collapse>
      </Card>
  )
}
