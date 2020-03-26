import { useQuery } from "@apollo/react-hooks";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Typography,
} from "@material-ui/core";
import Avatar from "@material-ui/core/Avatar";
import { deepOrange, deepPurple, grey } from "@material-ui/core/colors";
import { makeStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import { Alert } from "@material-ui/lab";
import { gql } from "apollo-boost";
import * as _ from "lodash";
import moment from "moment";
import React, { useState } from "react";
import { deserializeDate } from "./graphql";
import { Leg, PutCall } from "./portfolio";

export type SelectLegProps = {
  open: boolean;
  onClose: () => void;
  symbol: string;
  setSymbol: (s: string) => void;
  currentLeg?: Leg;
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

export function SelectLegModal(props: SelectLegProps) {
  const [tempLeg, rawSetTempLeg] = useState(
    (props.currentLeg || {}) as Partial<Leg>
  );
  const setTempLeg = (leg: Partial<Leg>) => {
    rawSetTempLeg({ ...tempLeg, ...leg });
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="md">
      <DialogTitle>Edit Option Leg</DialogTitle>

      <DialogContent>
        <LegOverview
          symbol={props.symbol}
          leg={tempLeg}
          setTempLeg={setTempLeg}
        />
      </DialogContent>

      <DialogContent />
      {tempLeg.t ? (
        <OptionChain
          symbol={props.symbol}
          expirationDate={tempLeg.t}
          setTempLeg={(leg) => setTempLeg({ ...tempLeg, ...leg })}
        />
      ) : (
        ""
      )}

      <DialogContent />
      <DialogActions>
        <Button color="secondary">Cancel</Button>
        <Button color="primary">OK</Button>
      </DialogActions>
    </Dialog>
  );
}

const legOverviewStyles = makeStyles((theme: Theme) => ({
  card: {
    padding: theme.spacing(2),
    width: "780px",
  },
  legOverviewBox: {
    "& *": {
      marginRight: theme.spacing(1),
    },
    "& *:last": {
      marginRight: 0,
    },
  },
  putCall: {},
  expiration: {
    flexGrow: 1,
  },
  quantity: {
    width: "100px",
  },
  strike: {
    width: "120px",
  },
  iv: {
    width: "110px",
  },
  orangeLong: {
    color: theme.palette.getContrastText(deepOrange[500]),
    backgroundColor: deepOrange[500],
    marginRight: theme.spacing(2),
  },
  orangeShort: {
    color: theme.palette.getContrastText(deepOrange[100]),
    backgroundColor: deepOrange[100],
    marginRight: theme.spacing(2),
  },
  purpleLong: {
    color: theme.palette.getContrastText(deepPurple[500]),
    backgroundColor: deepPurple[500],
    marginRight: theme.spacing(2),
  },
  purpleShort: {
    color: theme.palette.getContrastText(deepPurple[100]),
    backgroundColor: deepPurple[100],
    marginRight: theme.spacing(2),
  },
  grey: {
    color: theme.palette.getContrastText(grey[500]),
    backgroundColor: grey[500],
    marginRight: theme.spacing(2),
  },
}));

const LOAD_EXPIRATIONS_QUERY = gql`
  query stock($symbol: String!) {
    stock(symbol: $symbol) {
      id
      symbol
      expirations {
        id
        date
      }
    }
  }
`;

interface LegOverviewProps {
  symbol: string;
  leg: Partial<Leg>;
  setTempLeg: (leg: Partial<Leg>) => void;
}

function LegOverview(props: LegOverviewProps) {
  const classes = legOverviewStyles();

  const expirationsQuery = useQuery(LOAD_EXPIRATIONS_QUERY, {
    variables: { symbol: props.symbol },
  });

  function PutCallView() {
    const r = (className: string, fullName: string, shortName: string) => (
      <Tooltip title={fullName}>
        <Avatar className={className}>{shortName}</Avatar>
      </Tooltip>
    );
    if (!props.leg.quantity || props.leg.putCall === undefined) {
      return r(classes.grey, "None", "-");
    } else if (props.leg.quantity < 0 && props.leg.putCall === PutCall.CALL) {
      return r(classes.orangeShort, "Short Call (Net Credit)", "CS");
    } else if (props.leg.quantity > 0 && props.leg.putCall === PutCall.CALL) {
      return r(classes.orangeLong, "Long Call (Net Debit)", "CL");
    } else if (props.leg.quantity < 0 && props.leg.putCall === PutCall.PUT) {
      return r(classes.purpleShort, "Short Put (Net Credit)", "PS");
    } else if (props.leg.quantity > 0 && props.leg.putCall === PutCall.PUT) {
      return r(classes.purpleLong, "Long Put (Net Debit)", "PL");
    } else {
      throw new Error("Invalid props.leg: " + props.leg);
    }
  }

  return renderQuery(
    expirationsQuery,
    <Typography align="center">
      <CircularProgress />
    </Typography>,
    <Alert severity="error">
      This is an error message!
      <br />
      {"" + expirationsQuery.error}
    </Alert>,
    (data) => (
      <Card className={classes.card}>
        <Box
          display="flex"
          alignItems="center"
          flexDirection="row"
          className={classes.legOverviewBox}
        >
          <PutCallView />
          <FormControl className={classes.expiration} variant="outlined">
            <InputLabel>Expiration Date</InputLabel>
            <Select
              onChange={(e) => {
                if (e.target.value) {
                  const newT = deserializeDate(e.target.value as string);
                  props.setTempLeg({ ...props.leg, t: newT });
                }
              }}
            >
              {data.stock.expirations.map((exp: any) => {
                const date = deserializeDate(exp.date);
                return (
                  <MenuItem
                    key={exp.date}
                    value={exp.date}
                    selected={date.isSame(props.leg.t)}
                  >
                    {date.format("MMM DD, YYYY")} ({date.diff(moment(), "days")}{" "}
                    days)
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <TextField
            label="Qty"
            type="number"
            className={classes.quantity}
            variant="outlined"
            value={props.leg.quantity}
            disabled={!props.leg.t}
            onChange={(e) =>
              props.setTempLeg({
                ...props.leg,
                quantity: parseInt(e.target.value),
              })
            }
          />
          <TextField
            label="Strike"
            type="number"
            className={classes.strike}
            variant="outlined"
            value={props.leg.k}
            disabled={!props.leg.t}
            onChange={(e) =>
              props.setTempLeg({ ...props.leg, k: parseInt(e.target.value) })
            }
          />
          <TextField
            label="IV"
            type="number"
            className={classes.iv}
            variant="outlined"
            value={props.leg.k}
            disabled={true}
          />
        </Box>
      </Card>
    )
  );
}

type OptionChainProps = {
  symbol: string;
  expirationDate: moment.Moment;
  setTempLeg: (leg: Partial<Leg>) => void;
};

const LOAD_OPTION_QUOTES_QUERY = gql`
  query OptionQuotes($symbol: String!, $date: Date!) {
    expiration(symbol: $symbol, date: $date) {
      id
      quotes {
        id
        putCall
        strikePrice
        bid
        ask
        last
        impliedVolatility
      }
    }
  }
`;

const optionChainStyles = makeStyles((theme: Theme) => ({
  orange: {
    color: theme.palette.getContrastText(deepOrange[500]),
    backgroundColor: deepOrange[500],
  },
  purple: {
    color: theme.palette.getContrastText(deepPurple[500]),
    backgroundColor: deepPurple[500],
  },
  grey: {
    color: theme.palette.getContrastText(grey[300]),
    backgroundColor: grey[300],
    borderBottomColor: grey[300],
  },
}));

function OptionChain(props: OptionChainProps) {
  const classes = optionChainStyles();
  const query = useQuery(LOAD_OPTION_QUOTES_QUERY, {
    variables: { symbol: props.symbol, date: props.expirationDate },
  });

  function renderTable(data: any) {
    const quotes: number[] = data.expiration.quotes;
    const strikes: number[] = _.chain(quotes)
      .map((q: any) => q.strikePrice)
      .sortBy()
      .sortedUniq()
      .value();

    const forStrike = (strike: number, putCall: string): number | undefined =>
      _.chain(quotes)
        .filter((q: any) => q.strikePrice === strike && q.putCall === putCall)
        .head()
        .value();

    return (
      <TableContainer style={{ maxHeight: "50vh" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" className={classes.orange}>
                Last
              </TableCell>
              <TableCell align="center" className={classes.orange}>
                Bid
              </TableCell>
              <TableCell align="center" className={classes.orange}>
                Ask
              </TableCell>
              <TableCell align="center" className={classes.grey}>
                Strike
              </TableCell>
              <TableCell align="center" className={classes.purple}>
                Bid
              </TableCell>
              <TableCell align="center" className={classes.purple}>
                Ask
              </TableCell>
              <TableCell align="center" className={classes.purple}>
                Last
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {strikes.map((strike) => {
              const call: any = forStrike(strike, "CALL");
              const put: any = forStrike(strike, "PUT");
              const cell = (
                k: number,
                putCall: PutCall,
                entryCost: number,
                quantity: number
              ) => (
                <Button
                  onClick={() => props.setTempLeg({ putCall, k, quantity })}
                >
                  {entryCost.toFixed(2)}
                </Button>
              );
              return (
                <TableRow key={strike} hover>
                  <TableCell align="center">
                    {cell(strike, PutCall.CALL, call.last, 1)}
                  </TableCell>
                  <TableCell align="center">
                    {cell(strike, PutCall.CALL, call.bid, -1)}
                  </TableCell>
                  <TableCell align="center">
                    {cell(strike, PutCall.CALL, call.ask, 1)}
                  </TableCell>
                  <TableCell align="center" className={classes.grey}>
                    <b>{strike}</b>
                  </TableCell>
                  <TableCell align="center">
                    {cell(strike, PutCall.PUT, put.bid, -1)}
                  </TableCell>
                  <TableCell align="center">
                    {cell(strike, PutCall.PUT, put.ask, 1)}
                  </TableCell>
                  <TableCell align="center">
                    {cell(strike, PutCall.PUT, put.last, 1)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return renderQuery(
    query,
    <Typography align="center">
      <CircularProgress />
    </Typography>,
    <Alert severity="error">
      Could not load option quotes, please try again.
      <br />
      {"" + query.error}
    </Alert>,
    renderTable
  );
}

const renderQuery = (
  query: any,
  loading: any,
  error: any,
  f: (data: any) => any
) => {
  if (query.loading) {
    return loading;
  } else if (query.error) {
    return error;
  } else {
    return f(query.data);
  }
};
