import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./typedefs/typedefs";
import { resolvers } from "./resolvers/resolvers";
import depthLimit from "graphql-depth-limit";

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export const graphqlServer = () => {
  return new ApolloServer({
    schema,
    validationRules: [depthLimit(5)],
    introspection: process.env.NODE_ENV !== "production",
  });
};