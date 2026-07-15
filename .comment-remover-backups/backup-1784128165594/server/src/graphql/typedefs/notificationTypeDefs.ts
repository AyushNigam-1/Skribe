import gql from "graphql-tag";

export const notificationTypeDefs = gql`
type Notification {
    id: ID!
    recipient: User!
    sender: User
    type: String!
    draftTitle: String
    message: String!
    link: String
    isRead: Boolean!
    createdAt: String!
}

type Subscription {
  notificationAdded(userId: ID!): Notification!
}

type Query {
getNotifications(userId: ID!): [Notification!]!
}

type Mutation {
  markAllNotificationsRead: Boolean
  deleteNotification(id: ID!): Boolean  
}

`
