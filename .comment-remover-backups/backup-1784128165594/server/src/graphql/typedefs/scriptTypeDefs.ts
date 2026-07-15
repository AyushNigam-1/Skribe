import { gql } from "graphql-tag";

export const scriptTypeDefs = gql`
  enum Role {
    OWNER
    EDITOR
    CONTRIBUTOR
    VIEWER
  }

  type Author {
    id: ID!
    name: String!
    email: String
  }
  type Collaborator {
    user: User!
    role: String!
    status: String! # Will be "PENDING" or "ACCEPTED"
  }

  type Comment {
    text: String!
    createdAt: String!
    # ADDED: Author field so the frontend can display who wrote the comment
    author: Author!
  }

  type Paragraph {
    id: ID!
    text: String!
    createdAt: String!
    author: Author!
    likes: [ID!]!
    dislikes: [ID!]!
    comments: [Comment!]!
  }

  type Script {
    id: ID!
    author: Author!
    title: String!
    visibility: String!
    description: String!
    languages: [String!]!
    genres: [String!]!
    paragraphs: [Paragraph!]!
    likes: [ID!]!
    dislikes: [ID!]!
    createdAt: String!
    updatedAt: String!
    combinedText: String
    collaborators: [Collaborator!]
  }

  type MutationResponse {
    status: Boolean!
  }

  type ScriptContributors {
    contributors: [Contributor!]!
  }

  type Contributor {
    userId: ID!
    details: ContributorDetails!
  }

  type ContributorDetails {
    name: String!
    paragraphs: [Paragraph!]!
  }

  type ExportedDocument {
    filename: String!
    content: String!
    contentType: String!
  }

  type Query {
    getAllScripts: [Script!]!
    getScriptById(id: ID!): Script
    getScriptsByGenres(genres: [String!]!): [Script!]!
    getScriptContributors(scriptId: ID!): ScriptContributors!
    getParagraphById(paragraphId: ID!): Paragraph
    getCombinedText(scriptId: ID!): String!
    exportDocument(scriptId: ID!, format: String!): ExportedDocument!
    getUserContributionsByScript(userId: ID!, scriptId: ID!): [Paragraph!]!
  }

  type Mutation {
    createScript(
      title: String!
      visibility: String!
      languages: [String!]!
      genres: [String!]!
      description: String!
    ): Script!
    updateScript(
      scriptId: ID!
      title: String
      description: String
      visibility: String
      genres: [String]      
      languages: [String]
    ): Script!
    submitParagraph(scriptId: ID!, text: String!): Paragraph!
    markAsInterested(scriptId: ID!): MutationResponse!
    markAsNotInterested(scriptId: ID!): MutationResponse!
    markAsFavourite(scriptId: ID!): MutationResponse!
    deleteScript(scriptId: ID!): MutationResponse!
    likeScript(scriptId: ID!): MutationResponse!
    dislikeScript(scriptId: ID!): MutationResponse!
    addCollaborator(scriptId: ID!, identifier: String!, role: String!): Script
    removeCollaborator(scriptId: ID!, targetUserId: ID!): Script!
    acceptInvitation(scriptId: ID!): Script!
    declineInvitation(scriptId: ID!): Script!
    removeAllParagraphs(scriptId: ID!): Script
    removeAllCollaborators(scriptId: ID!): Script
    updateCollaboratorRole(
      scriptId: ID!
      targetUserId: ID!
      role: Role!
    ): Script!
  }
`;
