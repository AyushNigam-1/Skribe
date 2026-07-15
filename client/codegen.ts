import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  
  schema: "http://localhost:3000/graphql",
  
  documents: ["src/**/*.tsx", "src/**/*.ts", "src/**/*.js", "src/**/*.jsx"],
  generates: {
    "src/graphql/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true, 
      },
    },
  },
};

export default config;
