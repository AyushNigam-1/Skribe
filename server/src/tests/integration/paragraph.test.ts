import mongoose from "mongoose";
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { executeGraphql, clearDatabases, startTestInfrastructure, stopTestInfrastructure } from "./helper";
import { createTestUser, createTestScript, createTestParagraph } from "./dbFactories";
import Paragraph from "../../models/Paragraph";

import { auth } from "../../utils/auth";
vi.mock("../../utils/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(), 
        },
    },
}));

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

const EDIT_PARAGRAPH = `
  mutation EditParagraph($paragraphId: ID!, $text: String!) {
    editParagraph(paragraphId: $paragraphId, text: $text) {
      id
      text
    }
  }
`;

const DELETE_PARAGRAPH = `
  mutation DeleteParagraph($paragraphId: ID!) {
    deleteParagraph(paragraphId: $paragraphId) {
      status
    }
  }
`;

const ADD_COMMENT = `
  mutation AddComment($paragraphId: ID!, $text: String!) {
    addComment(paragraphId: $paragraphId, text: $text) {
      id
    }
  }
`;

const LIKE_PARAGRAPH = `
  mutation LikeParagraph($paragraphId: ID!) {
    likeParagraph(paragraphId: $paragraphId) {
      status
    }
  }
`;

describe("Paragraph Resolvers - Complete Integration Suite", () => {
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

    describe("Paragraph Queries - Edge Cases & Data Sanitization", () => {
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

        describe("exportDocument - Validations & File Name Formatting", () => {
            it("should immediately reject the request if an unsupported file format is requested", async () => {
                const author = await createTestUser();
                const script = await createTestScript(author._id as mongoose.Types.ObjectId, {
                    title: "My Awesome Script"
                });

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

                const script = await createTestScript(author._id as mongoose.Types.ObjectId, {
                    title: "Bad<Title>:?*\"\\|/Name"
                });

                const response = await executeGraphql(EXPORT_DOCUMENT, {
                    scriptId: script.id,
                    format: "md"
                });

                if (response.body.errors) {
                    console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
                }

                const exportData = response.body.data.exportDocument;

                expect(exportData.filename).toBe("BadTitleName.md");
                expect(exportData.contentType).toBe("text/markdown");
            });
        });
    });

    describe("Paragraph Mutations - RBAC & Validation Boundaries", () => {
        describe("editParagraph & deleteParagraph - Authorization Firewalls", () => {
            it("should aggressively block a random user from editing another user's paragraph", async () => {
                const scriptOwner = await createTestUser();
                const paragraphAuthor = await createTestUser();
                const randomRogueUser = await createTestUser();

                const script = await createTestScript(scriptOwner._id as mongoose.Types.ObjectId);
                const paragraph = await createTestParagraph(script._id as mongoose.Types.ObjectId, paragraphAuthor._id as mongoose.Types.ObjectId);

                mockAuthSession(randomRogueUser);

                const response = await executeGraphql(EDIT_PARAGRAPH, {
                    paragraphId: paragraph.id,
                    text: "I am hijacking this paragraph!"
                });

                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Not authorized to edit this paragraph");
                expect(response.body.data).toBeNull();
            });

            it("should aggressively block a random user from deleting another user's paragraph", async () => {
                const scriptOwner = await createTestUser();
                const paragraphAuthor = await createTestUser();
                const randomRogueUser = await createTestUser();

                const script = await createTestScript(scriptOwner._id as mongoose.Types.ObjectId);
                const paragraph = await createTestParagraph(script._id as mongoose.Types.ObjectId, paragraphAuthor._id as mongoose.Types.ObjectId);

                mockAuthSession(randomRogueUser);

                const response = await executeGraphql(DELETE_PARAGRAPH, {
                    paragraphId: paragraph.id
                });

                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Not authorized to delete this paragraph");
                expect(response.body.data).toBeNull();
            });
        });

        describe("Input Validation", () => {
            it("should actively reject attempts to edit a paragraph with empty text or just spaces", async () => {
                const paragraphAuthor = await createTestUser();
                const script = await createTestScript(paragraphAuthor._id as mongoose.Types.ObjectId);
                const paragraph = await createTestParagraph(script._id as mongoose.Types.ObjectId, paragraphAuthor._id as mongoose.Types.ObjectId);

                mockAuthSession(paragraphAuthor);

                const response = await executeGraphql(EDIT_PARAGRAPH, {
                    paragraphId: paragraph.id,
                    text: "     "
                });

                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Paragraph text cannot be empty");
                expect(response.body.data).toBeNull();
            });

            it("should actively reject attempts to submit an empty comment", async () => {
                const commenter = await createTestUser();
                const script = await createTestScript(commenter._id as mongoose.Types.ObjectId);
                const paragraph = await createTestParagraph(script._id as mongoose.Types.ObjectId, commenter._id as mongoose.Types.ObjectId);

                mockAuthSession(commenter);

                const response = await executeGraphql(ADD_COMMENT, {
                    paragraphId: paragraph.id,
                    text: "   "
                });

                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Comment cannot be empty");
                expect(response.body.data).toBeNull();
            });
        });

        describe("Double-Toggle Mechanics", () => {
            it("should successfully remove a like if the user likes a paragraph they have already liked", async () => {
                const liker = await createTestUser();
                const script = await createTestScript(liker._id as mongoose.Types.ObjectId);
                const paragraph = await createTestParagraph(script._id as mongoose.Types.ObjectId, liker._id as mongoose.Types.ObjectId);

                mockAuthSession(liker);

                await executeGraphql(LIKE_PARAGRAPH, { paragraphId: paragraph.id });

                const secondResponse = await executeGraphql(LIKE_PARAGRAPH, { paragraphId: paragraph.id });

                expect(secondResponse.body.errors).toBeUndefined();
                expect(secondResponse.body.data.likeParagraph.status).toBe(true);

                const updatedParagraph = await Paragraph.findById(paragraph._id);
                expect(updatedParagraph?.likes).toHaveLength(0);
            });
        });
    });
});