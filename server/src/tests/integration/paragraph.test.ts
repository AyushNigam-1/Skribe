// src/tests/integration/paragraph.test.ts
import mongoose from "mongoose";
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { executeGraphql, clearDatabases, startTestInfrastructure, stopTestInfrastructure } from "./helper";
import { createTestUser, createTestScript } from "./dbFactories";

// Define the precise GraphQL queries
const GET_PARAGRAPH_BY_ID = `
  query GetParagraphById($paragraphId: ID!) {
    getParagraphById(paragraphId: $paragraphId) {
      id
      text
    }
  }
`;

const GET_COMBINED_TEXT = `
  query GetCombinedText($scriptId: ID!) {
    getCombinedText(scriptId: $scriptId)
  }
`;

const EXPORT_DOCUMENT = `
  query ExportDocument($scriptId: ID!, $format: String!) {
    exportDocument(scriptId: $scriptId, format: $format) {
      filename
      contentType
    }
  }
`;

describe("Paragraph Queries - Edge Cases & Data Sanitization", () => {
    // Boot up Testcontainers for this test file
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
    // 1. ERROR BOUNDARIES & GRACEFUL FAILURES
    // =========================================================================
    describe("Resource Not Found Boundaries", () => {
        it("should safely return a GraphQL error when requesting a non-existent paragraph by ID", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const response = await executeGraphql(GET_PARAGRAPH_BY_ID, { paragraphId: fakeId });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toBe("Paragraph not found");
            expect(response.body.data.getParagraphById).toBeNull();
        });

        it("should safely return a GraphQL error when requesting combined text for a non-existent script", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const response = await executeGraphql(GET_COMBINED_TEXT, { scriptId: fakeId });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toBe("Script not found");
            expect(response.body.data).toBeNull();
        });
    });

    // =========================================================================
    // 2. EXPORT DOCUMENT: FORMAT VALIDATION & SANITIZATION
    // =========================================================================
    describe("exportDocument - Validations & File Name Formatting", () => {
        it("should immediately reject the request if an unsupported file format is requested", async () => {
            const author = await createTestUser();
            const script = await createTestScript(author._id as mongoose.Types.ObjectId, {
                title: "My Awesome Script"
            });

            // Request a format NOT handled by the resolver (e.g., 'docx' or 'xml')
            const response = await executeGraphql(EXPORT_DOCUMENT, {
                scriptId: script.id,
                format: "docx"
            });

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].message).toBe("Invalid format");
            expect(response.body.data).toBeNull();
        });

        it("should actively strip out illegal OS characters from the script title when generating the filename", async () => {
            const author = await createTestUser();

            // Seed a script with malicious/illegal file name characters included in the title
            const script = await createTestScript(author._id as mongoose.Types.ObjectId, {
                title: "Bad<Title>:?*\"\\|/Name"
            });

            // Request a valid markdown format
            const response = await executeGraphql(EXPORT_DOCUMENT, {
                scriptId: script.id,
                format: "md"
            });

            if (response.body.errors) {
                console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
            }

            const exportData = response.body.data.exportDocument;

            // Assert the Regex correctly purged the illegal characters, returning a safe filename
            expect(exportData.filename).toBe("BadTitleName.md");
            expect(exportData.contentType).toBe("text/markdown");
        });
    });
});