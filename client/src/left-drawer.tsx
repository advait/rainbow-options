import {Avatar, Box, Button, ButtonGroup, Card, CardHeader, Collapse, Drawer, Theme} from "@material-ui/core";
import {deepOrange, deepPurple, grey} from "@material-ui/core/colors";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import {makeStyles} from '@material-ui/core/styles';
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import clsx from 'clsx';
import moment from "moment";
import React, {useState} from "react";
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


type OptionLegCardProps = {
  leg: Partial<Leg>,
}

function OptionLegCard(props: OptionLegCardProps) {
  const classes = optionLegStyles();
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);

  return (
      <Card elevation={1} className={classes.card}>
        <CardHeader
            avatar={<Avatar>CS</Avatar>}
            title="Hello World"
            subheader={"This is a test"}
            action={<IconButton className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}><ExpandMoreIcon/></IconButton>}
            onClick={toggleExpanded}
            className={classes.cardHeader}
        />

        <Collapse in={expanded} timeout="auto">
          <Box flexDirection="row" className={classes.contentRow}>
            <ButtonGroup orientation="horizontal" variant="outlined" className={classes.largeButtonGroup}>
              <Button
                  className={classes.largeButton}>{props.leg.quantity && props.leg.quantity < 0 ? "Short" : "Long"} Call</Button>
              <Button
                  className={classes.largeButton}>{props.leg.quantity && props.leg.quantity < 0 ? "Short" : "Long"} Put</Button>
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
