import { gql } from "@apollo/client";

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($userId: ID!) {
    getNotifications(userId: $userId) {
      id
      type
      message
      draftTitle   
      link
      isRead
      createdAt
      sender {
        id
        name
      }
    }
  }
`;

export const NOTIFICATION_SUBSCRIPTION = gql`
  subscription OnNotificationAdded($userId: ID!) {
    notificationAdded(userId: $userId) {
      id
      type
      message
      draftTitle   
      link
      isRead
      createdAt
      sender {
        id
        name
      }
    }
  }
`;