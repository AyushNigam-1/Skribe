import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import {
  startTestInfrastructure,
  stopTestInfrastructure,
  clearDatabases,
  executeGraphql
} from "./helper";
import { createTestUser, createTestScript, createTestParagraph } from "./dbFactories";
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
const GET_USER_PROFILE = `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
      id
      name
    }
  }
`;

const GET_USER_FAVOURITES = `
  query GetUserFavourites($userId: ID!) {
    getUserFavourites(userId: $userId) {
      id
      title
      visibility
    }
  }
`;

describe("User Queries - Edge Cases & Security Boundaries", () => {
  beforeAll(async () => {
    await startTestInfrastructure();
  }, 60000);

  afterAll(async () => {
    await stopTestInfrastructure();
  });

  beforeEach(async () => {
    await clearDatabases();
  });

  // =========================================================================
  // 1. DATA PRIVACY & VISIBILITY FILTERS
  // =========================================================================
  describe("getUserContributions", () => {
    it("should actively filter out private script contributions when queried by an unauthenticated guest", async () => {
      const author = await createTestUser({ name: "Bob" });

      // 🚨 TS Fix: Cast _id as mongoose.Types.ObjectId
      const authorId = author._id as mongoose.Types.ObjectId;

      const publicScript = await createTestScript(authorId, { title: "Public", visibility: "Public" });
      const privateScript = await createTestScript(authorId, { title: "Secret", visibility: "Private" });

      await createTestParagraph(publicScript._id as mongoose.Types.ObjectId, authorId, { text: "Public paragraph" });
      await createTestParagraph(privateScript._id as mongoose.Types.ObjectId, authorId, { text: "Secret paragraph" });

      // 🚨 Relational Fix: Bind scripts to the user document
      author.scripts.push(publicScript._id as mongoose.Types.ObjectId);
      author.scripts.push(privateScript._id as mongoose.Types.ObjectId);
      await author.save();

      // 🚨 TS Fix: Use .id (which is a guaranteed string) for the GraphQL payload
      const response = await executeGraphql(GET_USER_CONTRIBUTIONS, { userId: author.id });

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
      const author = await createTestUser({ name: "Alice" });

      // 🚨 TS Fix: Cast _id as mongoose.Types.ObjectId
      const authorId = author._id as mongoose.Types.ObjectId;

      const publicScript = await createTestScript(authorId, { title: "Public Draft", visibility: "Public" });
      const privateScript = await createTestScript(authorId, { title: "Private Draft", visibility: "Private" });

      // 🚨 Relational Fix: Bind scripts to the user document
      author.scripts.push(publicScript._id as mongoose.Types.ObjectId);
      author.scripts.push(privateScript._id as mongoose.Types.ObjectId);
      await author.save();

      // 🚨 TS Fix: Use .id for string transmission
      const response = await executeGraphql(GET_USER_SCRIPTS, { userId: author.id });
      const scripts = response.body.data.getUserScripts;

      expect(scripts).toHaveLength(1);
      expect(scripts[0].title).toBe("Public Draft");

      // Verify Redis explicitly created the PUBLIC cache key and ONLY stored the public data
      const publicCacheKey = `user:${author.id}:scripts:public:v3`;
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
      const response = await executeGraphql(SEARCH_USERS, { query: "alice" });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe("User not authenticated");
    });
  });

  describe("getUserProfile - Not Found Handling", () => {
    it("should gracefully return a GraphQL error when requesting a non-existent user profile", async () => {
      // Generate a valid ObjectId that does not exist in the database
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await executeGraphql(GET_USER_PROFILE, { id: fakeId });

      // GraphQL still returns 200 OK for the HTTP request, but populates the errors array
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();

      // Assert our specific error message is passed to the client
      expect(response.body.errors[0].message).toBe("User not found");
      expect(response.body.data).toBeNull();
    });
  });

  // =========================================================================
  // 5. MULTI-CONDITION ARRAY FILTERING
  // =========================================================================
  describe("getUserFavourites - Privacy and Archive Filters", () => {
    describe("getUserFavourites - Privacy Filters", () => {
      it("should actively drop favourite scripts if they are private, only returning public scripts", async () => {
        const user = await createTestUser({ name: "Charlie" });
        const author = await createTestUser({ name: "Dave" });

        // Script 1: Public (Should be kept)
        const validScript = await createTestScript(author._id as mongoose.Types.ObjectId, {
          title: "Valid Script",
          visibility: "Public"
        });

        // Script 2: Private (Should be filtered out)
        const privateScript = await createTestScript(author._id as mongoose.Types.ObjectId, {
          title: "Private Script",
          visibility: "Private"
        });

        // Push both scripts into Charlie's favourites array
        user.favourites.push(validScript._id as mongoose.Types.ObjectId);
        user.favourites.push(privateScript._id as mongoose.Types.ObjectId);
        await user.save();

        // Hit the endpoint
        const response = await executeGraphql(GET_USER_FAVOURITES, { userId: user.id });

        if (response.body.errors) {
          console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
        }

        const favourites = response.body.data.getUserFavourites;

        // Assert the filtering logic worked: 2 total favourites -> 1 filtered out -> 1 remains
        expect(favourites).toHaveLength(1);
        expect(favourites[0].title).toBe("Valid Script");

        // Explicitly ensure the private script didn't leak through
        expect(favourites.some((f: any) => f.title === "Private Script")).toBe(false);
      });
    });
  })
});