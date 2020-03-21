import {GraphQLScalarType, Kind} from "graphql";
import * as moment from "moment";

/**
 * Converts graphql "Date" types to/from moment.
 */
const MomentDateType = new GraphQLScalarType({
  name: "Date",
  description: "Represents a data in YYYY-MM-DD format. Deserializes to moment.",
  serialize(value: moment.Moment): string {
    return value.format("YYYY-MM-DD");
  },
  parseValue(s: string): moment.Moment {
    return moment(s, "YYYY-MM-DD");
  },
  parseLiteral(ast): moment.Moment {
    if (ast.kind === Kind.STRING) {
      return moment(ast.value, "YYYY-MM-DD");
    }
    return null;
  }
});

export const resolvers = {
  Date: MomentDateType,
};