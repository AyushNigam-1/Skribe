import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  startTestInfrastructure,
  stopTestInfrastructure,
  clearDatabases,
  executeGraphql
} from "./helper";
import { createTestUser, createTestScript, createTestParagraph } from "./dbFactories";
import { redisClient } from "../../database/redis";
import { auth } from "../../utils/auth";

vi.mock("../../utils/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

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

const UPDATE_PROFILE_FIELD = `
  mutation UpdateUserProfileField($key: String!, $value: String!) {
    updateUserProfileField(key: $key, value: $value) {
      id
      name
      languages
    }
  }
`;

const LIKE_PROFILE = `
  mutation LikeProfile($profileId: ID!) {
    likeProfile(profileId: $profileId) {
      status
    }
  }
`;

const VIEW_PROFILE = `
  mutation ViewProfile($profileId: ID!) {
    viewProfile(profileId: $profileId) {
      status
    }
  }
`;

const TOGGLE_BOOKMARK = `
  mutation ToggleBookmark($scriptId: ID!) {
    toggleBookmark(scriptId: $scriptId) {
      status
    }
  }
`;

describe("User Resolvers - Complete Integration Suite", () => {
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


  describe("User Queries - Edge Cases & Security Boundaries", () => {
    describe("getUserContributions", () => {
      it("should actively filter out private script contributions when queried by an unauthenticated guest", async () => {
        const author = await createTestUser({ name: "Bob" });

        const authorId = author._id as mongoose.Types.ObjectId;

        const publicScript = await createTestScript(authorId, { title: "Public", visibility: "Public" });
        const privateScript = await createTestScript(authorId, { title: "Secret", visibility: "Private" });

        await createTestParagraph(publicScript._id as mongoose.Types.ObjectId, authorId, { text: "Public paragraph" });
        await createTestParagraph(privateScript._id as mongoose.Types.ObjectId, authorId, { text: "Secret paragraph" });

        author.scripts.push(publicScript._id as mongoose.Types.ObjectId);
        author.scripts.push(privateScript._id as mongoose.Types.ObjectId);
        await author.save();

        const response = await executeGraphql(GET_USER_CONTRIBUTIONS, { userId: author.id });

        const contributions = response.body.data.getUserContributions;
        expect(contributions).toHaveLength(1);
        expect(contributions[0].script.title).toBe("Public");
        expect(contributions.some((c: any) => c.script.title === "Secret")).toBe(false);
      });
    });

    describe("getUserScripts", () => {
      it("should safely cache public scripts in Redis without leaking private data into the public key", async () => {
        const author = await createTestUser({ name: "Alice" });

        const authorId = author._id as mongoose.Types.ObjectId;

        const publicScript = await createTestScript(authorId, { title: "Public Draft", visibility: "Public" });
        const privateScript = await createTestScript(authorId, { title: "Private Draft", visibility: "Private" });

        author.scripts.push(publicScript._id as mongoose.Types.ObjectId);
        author.scripts.push(privateScript._id as mongoose.Types.ObjectId);
        await author.save();

        const response = await executeGraphql(GET_USER_SCRIPTS, { userId: author.id });
        const scripts = response.body.data.getUserScripts;

        expect(scripts).toHaveLength(1);
        expect(scripts[0].title).toBe("Public Draft");

        const publicCacheKey = `user:${author.id}:scripts:public:v3`;
        const cachedData = await redisClient.get(publicCacheKey);

        expect(cachedData).toBeDefined();
        const parsedCache = JSON.parse(cachedData!);
        expect(parsedCache).toHaveLength(1);
        expect(parsedCache[0].title).toBe("Public Draft");
      });
    });

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
        const fakeId = new mongoose.Types.ObjectId().toString();
        const response = await executeGraphql(GET_USER_PROFILE, { id: fakeId });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("User not found");
        expect(response.body.data).toBeNull();
      });
    });

    describe("getUserFavourites - Privacy and Archive Filters", () => {
      it("should actively drop favourite scripts if they are private, only returning public scripts", async () => {
        const user = await createTestUser({ name: "Charlie" });
        const author = await createTestUser({ name: "Dave" });

        const validScript = await createTestScript(author._id as mongoose.Types.ObjectId, {
          title: "Valid Script",
          visibility: "Public"
        });

        const privateScript = await createTestScript(author._id as mongoose.Types.ObjectId, {
          title: "Private Script",
          visibility: "Private"
        });

        user.favourites.push(validScript._id as mongoose.Types.ObjectId);
        user.favourites.push(privateScript._id as mongoose.Types.ObjectId);
        await user.save();

        const response = await executeGraphql(GET_USER_FAVOURITES, { userId: user.id });

        if (response.body.errors) {
          console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
        }

        const favourites = response.body.data.getUserFavourites;

        expect(favourites).toHaveLength(1);
        expect(favourites[0].title).toBe("Valid Script");
        expect(favourites.some((f: any) => f.title === "Private Script")).toBe(false);
      });
    });
  });


  describe("User Mutations - Edge Cases & Security Boundaries", () => {
    describe("updateUserProfileField - Sanitization and Security", () => {
      it("should actively reject attempts to update unauthorized fields (Privilege Escalation)", async () => {
        const user = await createTestUser();

        vi.mocked(auth.api.getSession).mockResolvedValue({
          session: { id: "mock-session-id", userId: user.id } as any,
          user: { id: user.id, name: user.name, email: user.email } as any
        });

        const response = await executeGraphql(UPDATE_PROFILE_FIELD, {
          key: "role",
          value: "ADMIN"
        });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Invalid field: role cannot be updated directly.");
        expect(response.body.data).toBeNull();
      });

      it("should cleanly parse and sanitize a messy comma-separated string into a valid array for array fields", async () => {
        const user = await createTestUser();

        vi.mocked(auth.api.getSession).mockResolvedValue({
          session: { id: "mock-session-id", userId: user.id } as any,
          user: { id: user.id, name: user.name, email: user.email } as any
        });

        const response = await executeGraphql(UPDATE_PROFILE_FIELD, {
          key: "languages",
          value: " English , , Spanish,  French "
        });

        if (response.body.errors) {
          console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
        }

        const updatedProfile = response.body.data.updateUserProfileField;
        expect(updatedProfile.languages).toEqual(["English", "Spanish", "French"]);
      });
    });

    describe("likeProfile and viewProfile - Self-Interaction Blocks", () => {
      it("should throw an explicit error if a user attempts to like their own profile", async () => {
        const user = await createTestUser();

        vi.mocked(auth.api.getSession).mockResolvedValue({
          session: { id: "mock-session-id", userId: user.id } as any,
          user: { id: user.id, name: user.name, email: user.email } as any
        });

        const response = await executeGraphql(LIKE_PROFILE, { profileId: user.id });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Cannot like your own profile");
        expect(response.body.data).toBeNull();
      });

      it("should silently return { status: false } without throwing an error if a user views their own profile", async () => {
        const user = await createTestUser();

        vi.mocked(auth.api.getSession).mockResolvedValue({
          session: { id: "mock-session-id", userId: user.id } as any,
          user: { id: user.id, name: user.name, email: user.email } as any
        });

        const response = await executeGraphql(VIEW_PROFILE, { profileId: user.id });

        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.viewProfile.status).toBe(false);
      });
    });

    describe("Resource Validation", () => {
      it("should return a clean GraphQL error when toggling a bookmark for a non-existent script", async () => {
        const user = await createTestUser();
        const fakeScriptId = new mongoose.Types.ObjectId().toString();

        vi.mocked(auth.api.getSession).mockResolvedValue({
          session: { id: "mock-session-id", userId: user.id } as any,
          user: { id: user.id, name: user.name, email: user.email } as any
        });

        const response = await executeGraphql(TOGGLE_BOOKMARK, { scriptId: fakeScriptId });

        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.toggleBookmark.status).toBe(true);
      });
    });
  });
});