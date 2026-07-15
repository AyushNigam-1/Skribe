import { gql } from "@apollo/client";

export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
      id
      name
      username
      email
      bio
      languages
      favourites
      likes 
      followers
      follows
      views 
    }
  }
`;

export const GET_USER_SCRIPTS = gql`
  query GetUserScripts($userId: ID!) {
    getUserScripts(userId: $userId) {
      id
      title
      visibility
      description
      languages
      genres
      createdAt
      updatedAt
      author {
        id   # 🚨 FIX: Apollo NEEDS this to update the cache
        name
      }
    }
  }
`;

export const GET_USER_CONTRIBUTIONS = gql`
  query GetUserContributions($userId: ID!) {
    getUserContributions(userId: $userId) {
      id
      status
      text
      likes
      dislikes
      createdAt
      script {
        id
        title
      }
      comments {
        author {
          name
        }
        text
        createdAt
      }
    }
  }
`;

export const GET_USER_FAVOURITES = gql`
  query GetUserFavourites($userId: ID!) {
    getUserFavourites(userId: $userId) {
      id
      title
      visibility
      description
      languages
      genres
      createdAt
      updatedAt
      author {
        id   
        name
      }
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id
      name
      username
    }
  }
`;