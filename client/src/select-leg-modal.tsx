import {useQuery} from "@apollo/react-hooks";
import {makeStyles} from "@material-ui/core/styles";
import {gql} from "apollo-boost";
import exp from "constants";
import moment from "moment";
import React from 'react';
import {
  Button, CircularProgress, createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider, FormControl, InputLabel, MenuItem, Select, Theme,
  Typography
} from "@material-ui/core";
import {Alert} from "@material-ui/lab";

export type SelectLegProps = {
  open: boolean,
  onClose: () => void,
  symbol: string,
  setSymbol: (s: string) => void,
  selectedExpiration: moment.Moment,
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

export function SelectLegModal(props: SelectLegProps) {
  const classes = useStyles();

  const expirationsQuery = useQuery(LOAD_EXPIRATIONS_QUERY, {
    variables: {symbol: props.symbol}
  });

  const renderQuery = (query: any, loading: any, error: any, f: (data: any) => any) => {
    if (query.loading) {
      return loading;
    } else if (query.error) {
      return error;
    } else {
      console.log(query.data);
      return f(query.data)
    }
  };

  return (
      <Dialog
          open={props.open}
          onClose={props.onClose}
          maxWidth="md"
      >
        <DialogTitle>Edit Option Leg</DialogTitle>

        <DialogContent>
          {renderQuery(
              expirationsQuery,
              <CircularProgress/>,
              <Alert severity="error">This is an error message!<br/>{"" + expirationsQuery.error}</Alert>,
              (data) => {
                return (<FormControl className={classes.formControl}>
                  <InputLabel>Expiration Date</InputLabel>
                  <Select>
                    {data.stock.expirations.map((exp: any) => {
                      console.log("Item", exp);
                      const date = moment(exp.date, "YYYY-MM-DD");
                      return (<MenuItem value={exp.date}>{date.format("MMM DD, YYYY")} ({date.diff(moment(), "days")} days)</MenuItem>)
                    })}
                  </Select>
                </FormControl>)
              }
          )}
        </DialogContent>

        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Let Google help apps determine location. This means sending anonymous location data to
            Google, even when no apps are running.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button color="secondary">
            Disagree
          </Button>
          <Button color="primary">
            Agree
          </Button>
        </DialogActions>
      </Dialog>
  )
}

