import mongoose from "mongoose";
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { executeGraphql, clearDatabases, startTestInfrastructure, stopTestInfrastructure } from "./helper";
import { createTestUser, createTestNotification } from "./dbFactories";
import Notification from "../../models/Notification";

import { auth } from "../../utils/auth";
vi.mock("../../utils/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}));

const GET_NOTIFICATIONS = `
  query GetNotifications($userId: ID!) {
    getNotifications(userId: $userId) {
      id
      message
      isRead 
      createdAt
    }
  }
`;

const MARK_ALL_READ = `
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

const DELETE_NOTIFICATION = `
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id)
  }
`;

describe("Notification Resolvers - Complete Integration Suite", () => {
    beforeAll(async () => {
        await startTestInfrastructure();
    }, 60000);

    afterAll(async () => {
        await stopTestInfrastructure();
        vi.restoreAllMocks();
    });

    beforeEach(async () => {
        await clearDatabases();
        vi.resetAllMocks();
    });

    const mockAuthSession = (user: any) => {
        vi.mocked(auth.api.getSession).mockResolvedValue({
            session: { id: "mock-session-id", userId: user.id } as any,
            user: { id: user.id, name: user.name, email: user.email } as any
        });
    };

    describe("Notification Queries - Formatting & Fallbacks", () => {
        describe("getNotifications - Successful Retrieval", () => {
            it("should return formatted notifications and properly convert dates to Unix timestamp strings", async () => {
                const user = await createTestUser();
                const userId = user._id as mongoose.Types.ObjectId;

                await createTestNotification(userId, { message: "Test Notification 1", read: false });
                await createTestNotification(userId, { message: "Test Notification 2", read: true });

                const response = await executeGraphql(GET_NOTIFICATIONS, { userId: user.id });

                if (response.body.errors) {
                    console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
                }

                const notifications = response.body.data.getNotifications;

                expect(notifications).toHaveLength(2);

                const targetNotif = notifications.find((n: any) => n.message === "Test Notification 1");

                expect(targetNotif).toBeDefined();
                expect(targetNotif.id).toBeDefined();

                expect(typeof targetNotif.createdAt).toBe("string");

                expect(targetNotif.createdAt).toMatch(/^\d+$/);
            });
        });

        describe("getNotifications - Fallback Behaviors", () => {
            it("should safely return an empty array if the user has no notifications", async () => {
                const user = await createTestUser();

                const response = await executeGraphql(GET_NOTIFICATIONS, { userId: user.id });

                if (response.body.errors) {
                    console.error("GraphQL Errors (Empty State):", JSON.stringify(response.body.errors, null, 2));
                }

                const notifications = response.body.data?.getNotifications;

                expect(notifications).toEqual([]);
            });

            it("should safely return an empty array without crashing if an invalid or non-existent ID is passed", async () => {
                const fakeId = new mongoose.Types.ObjectId().toString();

                const response = await executeGraphql(GET_NOTIFICATIONS, { userId: fakeId });

                if (response.body.errors) {
                    console.error("GraphQL Errors (Invalid ID):", JSON.stringify(response.body.errors, null, 2));
                }

                const notifications = response.body.data?.getNotifications;

                expect(response.body.errors).toBeUndefined();
                expect(notifications).toEqual([]);
            });
        });
    });

    describe("Notification Mutations - Silent Fails & Data Isolation", () => {
        describe("Authentication - Graceful Rejections", () => {
            it("should silently return false when an unauthenticated user attempts to mark notifications as read", async () => {
                vi.mocked(auth.api.getSession).mockResolvedValue(null);

                const response = await executeGraphql(MARK_ALL_READ);

                expect(response.body.errors).toBeUndefined();
                expect(response.body.data.markAllNotificationsRead).toBe(false);
            });

            it("should silently return false when an unauthenticated user attempts to delete a notification", async () => {
                vi.mocked(auth.api.getSession).mockResolvedValue(null);

                const fakeId = new mongoose.Types.ObjectId().toString();
                const response = await executeGraphql(DELETE_NOTIFICATION, { id: fakeId });

                expect(response.body.errors).toBeUndefined();
                expect(response.body.data.deleteNotification).toBe(false);
            });
        });

        describe("deleteNotification - Cross-Account Boundaries", () => {
            it("should aggressively block a user from deleting another user's notification", async () => {
                const victimUser = await createTestUser();
                const rogueUser = await createTestUser();

                const notification = await createTestNotification(victimUser._id as mongoose.Types.ObjectId);

                mockAuthSession(rogueUser);

                const response = await executeGraphql(DELETE_NOTIFICATION, {
                    id: notification.id
                });

                expect(response.body.errors).toBeUndefined();
                expect(response.body.data.deleteNotification).toBe(false);

                const dbCheck = await Notification.findById(notification._id);
                expect(dbCheck).not.toBeNull();
            });
        });

        describe("Safe Handling of Missing Data", () => {
            it("should safely return false when attempting to delete a non-existent notification ID", async () => {
                const user = await createTestUser();
                mockAuthSession(user);

                const fakeId = new mongoose.Types.ObjectId().toString();
                const response = await executeGraphql(DELETE_NOTIFICATION, { id: fakeId });

                expect(response.body.errors).toBeUndefined();
                expect(response.body.data.deleteNotification).toBe(false);
            });

            it("should safely return true when calling markAllNotificationsRead even if the user has 0 notifications", async () => {
                const user = await createTestUser();
                mockAuthSession(user);

                const response = await executeGraphql(MARK_ALL_READ);

                expect(response.body.errors).toBeUndefined();
                expect(response.body.data.markAllNotificationsRead).toBe(true);
            });
        });
    });
});