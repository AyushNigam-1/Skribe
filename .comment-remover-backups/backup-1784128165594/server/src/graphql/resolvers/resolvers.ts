import { userQueries } from "./queries/userQueries";
import { scriptQueries } from "./queries/scriptQueries";
import { userMutations } from "./mutations/userMutations";
import { scriptMutations } from "./mutations/scriptMutations";
import { paragraphQueries } from "./queries/paragraphQueries";
import { paragraphMutations } from "./mutations/paragraphMutations";
import { notificationQueries } from "./queries/notificationsQueries";
import { notificationMutations } from "./mutations/notificationMutations";

export const resolvers = {
  Query: {
    ...userQueries,
    ...scriptQueries,
    ...paragraphQueries,
    ...notificationQueries
  },
  Mutation: {
    ...userMutations,
    ...scriptMutations,
    ...paragraphMutations,
    ...notificationMutations
  },
};
