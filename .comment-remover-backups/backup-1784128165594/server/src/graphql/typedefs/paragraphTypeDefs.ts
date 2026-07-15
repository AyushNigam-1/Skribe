import { gql } from "graphql-tag";

export const paragraphTypeDefs = gql`
  type Comment {
    author: Author!
    text: String!
    createdAt: String!
  }

  input CommentInput {
    text: String!
    createdAt: String!
  }

  type Paragraph {
    id: ID!
    script: Script!
    author: Author!
    text: String!
    status: String!
    likes: [ID!]!
    dislikes: [ID!]!
    comments: [Comment!]!
    createdAt: String!
  }

  type ExportedDocument {
    filename: String!
    content: String!
    contentType: String!
  }

  type Query {
    getParagraphById(paragraphId: ID!): Paragraph
    getCombinedText(scriptId: ID!): String!
    getPendingParagraphs(scriptId: ID!): [Paragraph!]!
    exportDocument(scriptId: ID!, format: String!): ExportedDocument!
    getFilteredRequests(scriptId: ID!, userId: ID, status: String): [Paragraph]
  }

  type Mutation {
    approveParagraph(paragraphId: ID!): MutationResponse!
    rejectParagraph(paragraphId: ID!): MutationResponse!
    editParagraph(paragraphId: ID!, text: String!): Paragraph!
    deleteParagraph(paragraphId: ID!): MutationResponse!
    likeParagraph(paragraphId: ID!): MutationResponse!
    dislikeParagraph(paragraphId: ID!): MutationResponse!
    addComment(paragraphId: ID!, text: String!): Paragraph!
  }
`;
