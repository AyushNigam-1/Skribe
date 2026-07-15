import { gql } from "@apollo/client";

export const UPDATE_USER_PROFILE_FIELD = gql`
  mutation UpdateUserProfileField($key: String!, $value: String!) {
    updateUserProfileField(key: $key, value: $value) {
      id
      name
      bio
      languages
    }
  }
`;

export const LIKE_PROFILE = gql`
  mutation LikeProfile($profileId: ID!) {
    likeProfile(profileId: $profileId) {
      status
    }
  }
`;

export const VIEW_PROFILE = gql`
  mutation ViewProfile($profileId: ID!) {
    viewProfile(profileId: $profileId) {
      status
    }
  }
`;

export const ACCEPT_INVITATION = gql`
  mutation AcceptInvitation($scriptId: ID!) {
    acceptInvitation(scriptId: $scriptId) {
      id
    }
  }
`;

export const DECLINE_INVITATION = gql`
  mutation DeclineInvitation($scriptId: ID!) {
    declineInvitation(scriptId: $scriptId) {
      id
    }
  }
`;