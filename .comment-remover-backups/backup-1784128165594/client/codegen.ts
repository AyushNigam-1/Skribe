import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  // Replace this with your actual local or production GraphQL endpoint
  schema: "http://localhost:3000/graphql",
  // Tells it to look at all your frontend files for gql`` tags
  documents: ["src/**/*.tsx", "src/**/*.ts", "src/**/*.js", "src/**/*.jsx"],
  generates: {
    "src/graphql/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true, // This is the magic part! It generates custom hooks.
      },
    },
  },
};

export default config;
