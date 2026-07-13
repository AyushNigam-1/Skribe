// src/tests/integration/scriptQueries.integration.test.ts
import mongoose from "mongoose";
import { redisClient } from "../../database/redis";
import { describe, it, expect, beforeEach } from "vitest";
import { executeGraphql, clearDatabases } from "./helper";
import { ScriptRepository } from "../../repositories/scriptRepository";

const GET_SCRIPT_BY_ID = `
  query GetScriptById($id: ID!) {
    getScriptById(id: $id) {
      id
      title
      collaborators { id status }
    }
  }
`;

const GET_SCRIPTS_BY_GENRES = `
  query GetScriptsByGenres($genres: [String!]) {
    getScriptsByGenres(genres: $genres) {
      id
      title
    }
  }
`;

describe("Script Queries - Complex Aggregations & Access Filters", () => {
    beforeEach(async () => {
        await clearDatabases();
    });

    // =========================================================================
    // 1. COLLABORATOR VISIBILITY & FILTER GATE
    // =========================================================================
    describe("getScriptById - State Filtering", () => {
        it("should strictly return ONLY collaborators with 'ACCEPTED' status, dropping PENDING/DECLINED records", async () => {
            // Seed a script containing multi-status collaborators directly to MongoDB
            const scriptId = new mongoose.Types.ObjectId();
            await ScriptRepository.create({
                _id: scriptId,
                title: "Observability Engine Document",
                visibility: "public",
                collaborators: [
                    { user: new mongoose.Types.ObjectId(), status: "ACCEPTED" },
                    { user: new mongoose.Types.ObjectId(), status: "PENDING" },
                    { user: new mongoose.Types.ObjectId(), status: "DECLINED" }
                ]
            });

            // Fire through Supertest to hit the live Apollo pipeline
            const response = await executeGraphql(GET_SCRIPT_BY_ID, { id: scriptId.toString() });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeUndefined();

            const script = response.body.data.getScriptById;
            expect(script).toBeDefined();
            // It must strip out the 2 non-accepted collaborators on the fly
            expect(script.collaborators).toHaveLength(1);
            expect(script.collaborators[0].status).toBe("ACCEPTED");
        });
    });

    // =========================================================================
    // 2. GENRE CACHE KEY ALPHANUMERIC SORT MATCHING
    // =========================================================================
    describe("getScriptsByGenres - Deterministic Cache Key Integrity", () => {
        it("should look up and save data into a sorted genre key so arrays passed in different orders hit the exact same cache slot", async () => {
            // Seed a mock script that qualifies under multiple genres
            await ScriptRepository.create({
                title: "The Golden Thread Handbook",
                visibility: "public",
                genres: ["Sci-Fi", "Thriller"]
            });

            // 1. Request with genres array ordered: ["Thriller", "Sci-Fi"]
            const resOrderA = await executeGraphql(GET_SCRIPTS_BY_GENRES, { genres: ["Thriller", "Sci-Fi"] });
            expect(resOrderA.body.data.getScriptsByGenres).toHaveLength(1);

            // Verify the backend deterministically sorted the key to `Sci-Fi,Thriller` in Redis
            const baselineCacheKey = "scripts:genres:public:Sci-Fi,Thriller:v3";
            const cachedString = await redisClient.get(baselineCacheKey);
            expect(cachedString).toBeDefined();
            expect(JSON.parse(cachedString!)).toHaveLength(1);

            // 2. Clear out Mongoose spies or manually clear DB to guarantee any subsequent responses are *only* coming from the cache layer
            if (mongoose.connection.db) {
                await mongoose.connection.db.collection("scripts").deleteMany({});
            }

            // 3. Request with genres array inverted: ["Sci-Fi", "Thriller"]
            const resOrderB = await executeGraphql(GET_SCRIPTS_BY_GENRES, { genres: ["Sci-Fi", "Thriller"] });

            // If cache mapping fails sorting logic, this would return 0 records because the DB was wiped!
            expect(resOrderB.body.data.getScriptsByGenres).toHaveLength(1);
            expect(resOrderB.body.data.getScriptsByGenres[0].title).toBe("The Golden Thread Handbook");
        });
    });
});