import { gql } from "@apollo/client";

export const EDIT_PARAGRAPH = gql`
  mutation EditParagraph($paragraphId: ID!, $text: String!) {
    editParagraph(paragraphId: $paragraphId, text: $text) {
      id
      text
      createdAt
      author {
        id
        name
      }
    }
  }
`;

export const DELETE_PARAGRAPH = gql`
  mutation DeleteParagraph($paragraphId: ID!) {
    deleteParagraph(paragraphId: $paragraphId) {
      status
    }
  }
`;

export const LIKE_PARAGRAPH = gql`
  mutation LikeParagraph($paragraphId: ID!) {
    likeParagraph(paragraphId: $paragraphId) {
      status
    }
  }
`;

export const DISLIKE_PARAGRAPH = gql`
  mutation DislikeParagraph($paragraphId: ID!) {
    dislikeParagraph(paragraphId: $paragraphId) {
      status
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($paragraphId: ID!, $text: String!) {
    addComment(paragraphId: $paragraphId, text: $text) {
      id
      comments {
        text
        createdAt
        author {
          id
          name
        }
      }
    }
  }
`;
