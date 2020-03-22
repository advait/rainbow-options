import {useQuery} from "@apollo/react-hooks";
import {
  Button,
  CircularProgress,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme, Typography
} from "@material-ui/core";
import {deepOrange, deepPurple, grey} from "@material-ui/core/colors";
import {makeStyles} from "@material-ui/core/styles";
import {Alert} from "@material-ui/lab";
import {gql} from "apollo-boost";
import * as _ from "lodash";
import moment from "moment";
import React, {useState} from 'react';
import {deserializeDate} from "./graphql";
import {Leg} from "./portfolio";

export type SelectLegProps = {
  open: boolean,
  onClose: () => void,
  symbol: string,
  setSymbol: (s: string) => void,
  currentLeg?: Leg,
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      formControl: {
        minWidth: 200,
      },
    }),
);


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

type Partial<T> = {
  [P in keyof T]?: T[P];
}

export function SelectLegModal(props: SelectLegProps) {
  const classes = useStyles();

  const [tempLeg, setTempLeg] = useState((props.currentLeg || {}) as Partial<Leg>);

  const expirationsQuery = useQuery(LOAD_EXPIRATIONS_QUERY, {
    variables: {symbol: props.symbol}
  });

  return (
      <Dialog
          open={props.open}
          onClose={props.onClose}
          maxWidth="md"
      >
        <DialogTitle>Edit Option Leg</DialogTitle>

        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Let Google help apps determine location. This means sending anonymous location data to
            Google, even when no apps are running.
          </DialogContentText>
        </DialogContent>

        <DialogContent>
          {renderQuery(
              expirationsQuery,
              <Typography align="center"><CircularProgress/></Typography>,
              <Alert severity="error">This is an error message!<br/>{"" + expirationsQuery.error}</Alert>,
              (data) => {
                return (
                    <FormControl
                        className={classes.formControl}>
                      <InputLabel>Expiration Date</InputLabel>
                      <Select
                          onChange={(e) => {
                            console.log(e);
                            if (e.target.value) {
                              const newT = deserializeDate(e.target.value as string);
                              setTempLeg({...tempLeg, t: newT})
                            }
                          }}>
                        {data.stock.expirations.map((exp: any) => {
                          const date = deserializeDate(exp.date);
                          return (
                              <MenuItem key={exp.date} value={exp.date} selected={date.isSame(tempLeg.t)}>
                                {date.format("MMM DD, YYYY")} ({date.diff(moment(), "days")} days)
                              </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>)
              }
          )}
        </DialogContent>

        <DialogContent/>
        {tempLeg.t
            ? <OptionChain symbol={props.symbol} expirationDate={tempLeg.t}/>
            : ""
        }

        <DialogActions>
          <Button color="secondary">
            Cancel
          </Button>
          <Button color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
  )
}

type OptionChainProps = {
  symbol: string,
  expirationDate: moment.Moment,
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
  orangeShort: {
    color: theme.palette.getContrastText(deepOrange[300]),
    backgroundColor: deepOrange[300],
  },
  purpleShort: {
    color: theme.palette.getContrastText(deepPurple[300]),
    backgroundColor: deepPurple[300],
  },
  grey: {
    color: theme.palette.getContrastText(grey[300]),
    backgroundColor: grey[300],
  },
}));


function OptionChain(props: OptionChainProps) {
  const classes = optionChainStyles();
  const query = useQuery(LOAD_OPTION_QUOTES_QUERY, {
    variables: {symbol: props.symbol, date: props.expirationDate}
  });

  function renderTable(data: any) {
    const quotes: number[] = data.expiration.quotes;
    const strikes: number[] = _.chain(quotes)
        .map((q: any) => q.strikePrice)
        .sortBy()
        .sortedUniq()
        .value();

    const forStrike = (strike: number, putCall: string): number | undefined => (_.chain(quotes)
            .filter((q: any) => q.strikePrice === strike && q.putCall === putCall)
            .head()
            .value()
    );
    debugger;

    return (
        <TableContainer style={{maxHeight: "50vh"}}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell align="center" className={classes.orangeShort}>Bid</TableCell>
                <TableCell align="center" className={classes.orangeShort}>Ask</TableCell>
                <TableCell align="center" className={classes.orangeShort}>Last</TableCell>
                <TableCell align="center" className={classes.grey}>Strike</TableCell>
                <TableCell align="center" className={classes.purpleShort}>Bid</TableCell>
                <TableCell align="center" className={classes.purpleShort}>Ask</TableCell>
                <TableCell align="center" className={classes.purpleShort}>Last</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {strikes.map(strike => {
                const call: any = forStrike(strike, "CALL");
                const put: any = forStrike(strike, "PUT");
                const dollar = (n: number) => `${n.toFixed(2)}`;
                return (
                    <TableRow key={strike} hover>
                      <TableCell align="center">{dollar(call.bid)}</TableCell>
                      <TableCell align="center">{dollar(call.ask)}</TableCell>
                      <TableCell align="center">{dollar(call.last)}</TableCell>
                      <TableCell align="center" className={classes.grey}><b>{strike}</b></TableCell>
                      <TableCell align="center">{dollar(put.bid)}</TableCell>
                      <TableCell align="center">{dollar(put.ask)}</TableCell>
                      <TableCell align="center">{dollar(put.last)}</TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
    )
  }

  return renderQuery(query,
      <Typography align="center"><CircularProgress/></Typography>,
      <Alert severity="error">Could not load option quotes, please try again.<br/>{"" + query.error}</Alert>,
      renderTable,
  );
}

const renderQuery = (query: any, loading: any, error: any, f: (data: any) => any) => {
  if (query.loading) {
    return loading;
  } else if (query.error) {
    return error;
  } else {
    return f(query.data)
  }
};
