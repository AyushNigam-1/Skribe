import mongoose from "mongoose";
import { createTestUser, createTestNotification } from "./dbFactories";
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { executeGraphql, clearDatabases, startTestInfrastructure, stopTestInfrastructure } from "./helper";

// Define the GraphQL query exactly as the frontend would send it
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

describe("Notification Queries - Formatting & Fallbacks", () => {
    // Boot up Testcontainers for this suite
    beforeAll(async () => {
        await startTestInfrastructure();
    }, 60000);

    afterAll(async () => {
        await stopTestInfrastructure();
    });

    // Wipe databases cleanly before every single test
    beforeEach(async () => {
        await clearDatabases();
    });

    // =========================================================================
    // 1. DATA TRANSFORMATION & MAPPING
    // =========================================================================
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

            // Assert it fetched the correct amount
            expect(notifications).toHaveLength(2);

            // 🚨 FIX: Make the test order-agnostic by finding the specific notification
            const targetNotif = notifications.find((n: any) => n.message === "Test Notification 1");

            // Verify it was actually returned
            expect(targetNotif).toBeDefined();
            expect(targetNotif.id).toBeDefined();

            // Assert the custom transformation logic from your resolver worked
            expect(typeof targetNotif.createdAt).toBe("string");

            // Verify it is a valid Unix timestamp string (only numbers)
            expect(targetNotif.createdAt).toMatch(/^\d+$/);
        });
    });

    // =========================================================================
    // 2. EMPTY STATES & ERROR SUPPRESSION
    // =========================================================================
    describe("getNotifications - Fallback Behaviors", () => {
        it("should safely return an empty array if the user has no notifications", async () => {
            const user = await createTestUser();

            const response = await executeGraphql(GET_NOTIFICATIONS, { userId: user.id });

            // 🚨 DEBUG: Print the exact GraphQL validation error if it fails
            if (response.body.errors) {
                console.error("GraphQL Errors (Empty State):", JSON.stringify(response.body.errors, null, 2));
            }

            // 🚨 FIX: Use optional chaining (?.) in case 'data' is completely undefined
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