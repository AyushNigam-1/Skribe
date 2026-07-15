import { gql } from "graphql-tag";

export const userTypeDefs = gql`
  type User {
    id: ID
    name: String!
    email: String!
    username: String
    image: String
    token: String!
    languages: [String]
    bio: String
    favourites: [ID]
    contibutions: [ID]
    likes: [ID]
    followers: [ID]
    views: [ID]
    scripts: [ID]
    follows: [ID]
  }

  type UserContribution {
    id: ID!
    status: String!
    text: String!
    likes: [ID!]!
    dislikes: [ID!]!
    createdAt: String!
    script: Script!
    comments: [Comment!]!
  }

  type RefreshTokenResponse {
    token: String!
  }

  type Query {
    getUserProfile(id: ID!): User!
    getUserScripts(userId: ID!): [Script!]!
    getUserContributions(userId: ID!): [UserContribution!]!
    getUserFavourites(userId: ID!): [Script!]!
    searchUsers(query: String!): [User]
  }

  type Mutation {
    register(name: String!, password: String!, email: String): User
    login(name: String!, password: String!): User
    logout: Boolean!
    toggleBookmark(scriptId: ID!): MutationResponse!
    updateUserProfileField(key: String!, value: String!): User!
    likeProfile(profileId: ID!): MutationResponse!
    viewProfile(profileId: ID!): MutationResponse!
    refreshToken: RefreshTokenResponse!
  }
`;
