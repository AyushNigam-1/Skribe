import { gql } from "@apollo/client";

export const GET_SCRIPT_BY_ID = gql`
  query GetScriptById($id: ID!) {
    getScriptById(id: $id) {
      id
      title
      visibility
      languages
      genres
      description
      createdAt
      combinedText
      likes
      dislikes

      author {
        id
        name
      }

      collaborators {
        role
        user {
          id
          name
        }
      }

      paragraphs {
        id
        text
        status
        likes
        dislikes
        createdAt
        author {
          id
          name
        }
        comments {
          author {
            id
            name
          }
          text
          createdAt
        }
      }
    }
  }
`;

export const GET_SCRIPTS_BY_GENRES = gql`
  query GetScriptsByGenres($genres: [String!]!) {
    getScriptsByGenres(genres: $genres) {
      id
      title
      genres
      description
      likes
      languages
      dislikes
      createdAt
      author {
        name
      }
    }
  }
`;

export const GET_SCRIPT_CONTRIBUTORS = gql`
  query GetScriptContributors($scriptId: ID!) {
    getScriptContributors(scriptId: $scriptId) {
      contributors {
        userId
        details {
          name
          paragraphs {
            id
            text
            status
            createdAt
            likes
            dislikes
            author {
              name
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
      }
    }
  }
`;

export const GET_USER_CONTRIBUTIONS_BY_SCRIPT = gql`
  query GetUserContributionsByScript($userId: ID!, $scriptId: ID!) {
    getUserContributionsByScript(userId: $userId, scriptId: $scriptId) {
      id
      text
      status
      createdAt
      likes
      dislikes
      script {
        id
        title
      }
      author {
        id
        name
      }
      comments {
        text
        createdAt
        author {
          name
        }
      }
    }
  }
`;
