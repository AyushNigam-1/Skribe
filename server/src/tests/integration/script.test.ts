// src/tests/integration/script.test.ts
import mongoose from "mongoose";
import { redisClient } from "../../database/redis";
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { executeGraphql, clearDatabases, startTestInfrastructure, stopTestInfrastructure } from "./helper";
import { createTestUser, createTestScript, createTestParagraph } from "./dbFactories";

// 🚨 FIX 1: Removed 'id' from collaborators to prevent Schema Validation Error
const GET_SCRIPT_BY_ID = `
  query GetScriptById($id: ID!) {
    getScriptById(id: $id) {
      id
      title
      collaborators { 
        status 
      }
    }
  }
`;

const GET_SCRIPTS_BY_GENRES = `
  query GetScriptsByGenres($genres: [String!]!) {
    getScriptsByGenres(genres: $genres) {
      id
      title
    }
  }
`;

const GET_SCRIPT_CONTRIBUTORS = `
  query GetScriptContributors($scriptId: ID!) {
    getScriptContributors(scriptId: $scriptId) {
      contributors {
        userId
        details {
          name
          paragraphs { text }
        }
      }
    }
  }
`;

describe("Script Queries - Complex Aggregations & Access Filters", () => {
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
    // 1. COLLABORATOR VISIBILITY & FILTER GATE
    // =========================================================================
    describe("getScriptById - State Filtering", () => {
        it("should strictly return ONLY collaborators with 'ACCEPTED' status, dropping PENDING records", async () => {
            const author = await createTestUser();
            const authorId = author._id as mongoose.Types.ObjectId;

            const scriptId = new mongoose.Types.ObjectId();

            await createTestScript(authorId, {
                _id: scriptId,
                title: "Observability Engine Document",
                visibility: "Public",
                collaborators: [
                    { user: new mongoose.Types.ObjectId(), role: "EDITOR", status: "ACCEPTED" },
                    { user: new mongoose.Types.ObjectId(), role: "VIEWER", status: "PENDING" },
                ]
            });

            const response = await executeGraphql(GET_SCRIPT_BY_ID, { id: scriptId.toString() });

            // 🚨 DEBUG HELPER: Prints the exact GraphQL error if it fails again
            if (response.body.errors) {
                console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
            }

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeUndefined();

            const script = response.body.data.getScriptById;
            expect(script).toBeDefined();

            expect(script.collaborators).toHaveLength(1);
            expect(script.collaborators[0].status).toBe("ACCEPTED");
        }, 15000);
    });

    // =========================================================================
    // 2. GENRE CACHE KEY ALPHANUMERIC SORT MATCHING
    // =========================================================================
    describe("getScriptsByGenres - Deterministic Cache Key Integrity", () => {
        it("should look up and save data into a sorted genre key so arrays passed in different orders hit the exact same cache slot", async () => {
            const author = await createTestUser();

            await createTestScript(author._id as mongoose.Types.ObjectId, {
                title: "The Golden Thread Handbook",
                visibility: "Public",
                genres: ["Sci-Fi", "Thriller"]
            });

            const resOrderA = await executeGraphql(GET_SCRIPTS_BY_GENRES, { genres: ["Thriller", "Sci-Fi"] });

            if (resOrderA.body.errors) {
                console.error("GraphQL Errors (resOrderA):", JSON.stringify(resOrderA.body.errors, null, 2));
            }

            expect(resOrderA.body.data.getScriptsByGenres).toHaveLength(1);

            const baselineCacheKey = "scripts:genres:public:Sci-Fi,Thriller:v3";
            const cachedString = await redisClient.get(baselineCacheKey);
            expect(cachedString).toBeDefined();
            expect(JSON.parse(cachedString!)).toHaveLength(1);

            if (mongoose.connection.db) {
                await mongoose.connection.db.collection("scripts").deleteMany({});
            }

            const resOrderB = await executeGraphql(GET_SCRIPTS_BY_GENRES, { genres: ["Sci-Fi", "Thriller"] });

            if (resOrderB.body.errors) {
                console.error("GraphQL Errors (resOrderB):", JSON.stringify(resOrderB.body.errors, null, 2));
            }

            expect(resOrderB.body.data.getScriptsByGenres).toHaveLength(1);
            expect(resOrderB.body.data.getScriptsByGenres[0].title).toBe("The Golden Thread Handbook");
        }, 15000);
    });

    // =========================================================================
    // 3. MAP REDUCTION & DATA AGGREGATION
    // =========================================================================
    describe("getScriptContributors - Author Grouping Logic", () => {
        it("should group multiple paragraphs by the same author into a single contributor entry using the Map logic", async () => {
            // Seed a valid author and script
            const author = await createTestUser({ name: "Prolific Writer" });
            const authorId = author._id as mongoose.Types.ObjectId;
            const script = await createTestScript(authorId);
            const scriptId = script._id as mongoose.Types.ObjectId;

            // Seed THREE separate paragraphs, all written by the SAME author, for the SAME script
            await createTestParagraph(scriptId, authorId, { text: "Paragraph 1" });
            await createTestParagraph(scriptId, authorId, { text: "Paragraph 2" });
            await createTestParagraph(scriptId, authorId, { text: "Paragraph 3" });

            // Execute the query
            const response = await executeGraphql(GET_SCRIPT_CONTRIBUTORS, { scriptId: scriptId.toString() });

            if (response.body.errors) {
                console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
            }

            const contributorsList = response.body.data.getScriptContributors.contributors;

            // Assert the reduction logic worked: 3 paragraphs should result in exactly 1 contributor entry
            expect(contributorsList).toHaveLength(1);
            expect(contributorsList[0].userId).toBe(authorId.toString());

            // Assert all 3 paragraphs were pushed into the details array
            expect(contributorsList[0].details.paragraphs).toHaveLength(3);
        }, 15000);
    });

    // =========================================================================
    // 4. ERROR BOUNDARIES & GRACEFUL FAILURES
    // =========================================================================
    describe("getScriptById - Not Found Handling", () => {
        it("should gracefully return a GraphQL error when requesting a non-existent script ID", async () => {
            // Generate a structurally valid MongoDB ObjectId that definitely doesn't exist in the DB
            const fakeId = new mongoose.Types.ObjectId().toString();

            const response = await executeGraphql(GET_SCRIPT_BY_ID, { id: fakeId });

            // GraphQL still returns 200 OK for the HTTP request, but populates the errors array
            expect(response.status).toBe(200);
            expect(response.body.errors).toBeDefined();

            // Assert our specific error message is passed to the client
            expect(response.body.errors[0].message).toBe("Script not found");

            // Assert the data payload is null because the resolver threw an error
            expect(response.body.data.getScriptById).toBeNull();
        }, 15000);
    });
});