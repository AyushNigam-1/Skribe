import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloProvider,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

const httpLink = new HttpLink({
  uri: `${import.meta.env.VITE_CLIENT_URL}/graphql`,
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
  let isUnauthenticated = false;

  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      const code = err.extensions?.code;
      const msg = err.message.toLowerCase();
      if (
        code === "UNAUTHENTICATED" ||
        msg.includes("not authenticated") ||
        msg.includes("auth required")
      ) {
        isUnauthenticated = true;
      }
    }
  }

  if (
    networkError &&
    "statusCode" in networkError &&
    networkError.statusCode === 401
  ) {
    isUnauthenticated = true;
  }

  if (isUnauthenticated) {
    console.error("⚠️ Session expired or invalid. Logging out.");
    window.location.href = "/login";
  }
});

const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    addTypename: false,
  }),
});

export const CustomApolloProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};