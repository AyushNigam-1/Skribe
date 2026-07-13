import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
    startTestInfrastructure,
    stopTestInfrastructure,
    clearDatabases,
    executeGraphql
} from "./helper";
import User from "../../models/User"
import { ScriptRepository } from "../../repositories/scriptRepository";
import Paragraph from "../../models/Paragraph";
import { redisClient } from "../../database/redis";

// Define the GraphQL queries exactly as the frontend would send them
const GET_USER_CONTRIBUTIONS = `
  query GetUserContributions($userId: ID!) {
    getUserContributions(userId: $userId) {
      id
      text
      script { title visibility }
    }
  }
`;

const GET_USER_SCRIPTS = `
  query GetUserScripts($userId: ID!) {
    getUserScripts(userId: $userId) {
      id
      title
      visibility
    }
  }
`;

const SEARCH_USERS = `
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id
      name
    }
  }
`;

describe("User Queries - Edge Cases & Security Boundaries", () => {
    // Spin up Docker containers before the suite runs
    beforeAll(async () => {
        await startTestInfrastructure();
    }, 60000); // 60s timeout for initial image pull

    afterAll(async () => {
        await stopTestInfrastructure();
    });

    // Wipe MongoDB and Redis cleanly before every single test
    beforeEach(async () => {
        await clearDatabases();
    });

    // =========================================================================
    // 1. DATA PRIVACY & VISIBILITY FILTERS
    // =========================================================================
    describe("getUserContributions", () => {
        it("should actively filter out private script contributions when queried by an unauthenticated guest", async () => {
            // 1. Seed MongoDB directly via Mongoose
            const author = await User.create({ name: "Bob", email: "bob@test.com" });

            const publicScript = await ScriptRepository.create({ title: "Public", visibility: "public", author: author._id });
            const privateScript = await ScriptRepository.create({ title: "Secret", visibility: "private", author: author._id });

            await Paragraph.create({ text: "Public paragraph", script: publicScript._id, author: author._id });
            await Paragraph.create({ text: "Secret paragraph", script: privateScript._id, author: author._id });

            // 2. Hit the real endpoint using Supertest (without session cookies)
            const response = await executeGraphql(GET_USER_CONTRIBUTIONS, { userId: author._id.toString() });

            // 3. Assert the GraphQL logic securely removed the private paragraph
            const contributions = response.body.data.getUserContributions;
            expect(contributions).toHaveLength(1);
            expect(contributions[0].script.title).toBe("Public");
            expect(contributions.some((c: any) => c.script.title === "Secret")).toBe(false);
        });
    });

    // =========================================================================
    // 2. CACHE SEGREGATION INTEGRITY
    // =========================================================================
    describe("getUserScripts", () => {
        it("should safely cache public scripts in Redis without leaking private data into the public key", async () => {
            const author = await User.create({ name: "Alice", email: "alice@test.com" });
            await ScriptRepository.create({ title: "Public Draft", visibility: "public", author: author._id });
            await ScriptRepository.create({ title: "Private Draft", visibility: "private", author: author._id });

            // Hit endpoint as an unauthenticated guest
            const response = await executeGraphql(GET_USER_SCRIPTS, { userId: author._id.toString() });
            const scripts = response.body.data.getUserScripts;

            expect(scripts).toHaveLength(1);
            expect(scripts[0].title).toBe("Public Draft");

            // Verify Redis explicitly created the PUBLIC cache key and ONLY stored the public data
            const publicCacheKey = `user:${author._id.toString()}:scripts:public:v3`;
            const cachedData = await redisClient.get(publicCacheKey);

            expect(cachedData).toBeDefined();
            const parsedCache = JSON.parse(cachedData!);
            expect(parsedCache).toHaveLength(1);
            expect(parsedCache[0].title).toBe("Public Draft");
        });
    });

    // =========================================================================
    // 3. AUTHENTICATION GATES
    // =========================================================================
    describe("searchUsers", () => {
        it("should strictly reject searches with an explicit auth error if the request lacks a valid session", async () => {
            // Execute query with no session cookie
            const response = await executeGraphql(SEARCH_USERS, { query: "alice" });

            // GraphQL always returns 200, but the errors array must contain our security bounce
            expect(response.status).toBe(200);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toBe("User not authenticated");
        });
    });
});