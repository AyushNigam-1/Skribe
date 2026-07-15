import mongoose from "mongoose";
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { redisClient } from "../../database/redis";
import Script from "../../models/Script";
import {
    executeGraphql,
    clearDatabases,
    startTestInfrastructure,
    stopTestInfrastructure
} from "./helper";
import {
    createTestUser,
    createTestScript,
    createTestParagraph
} from "./dbFactories";

import { auth } from "../../utils/auth";
vi.mock("../../utils/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}));


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

const ADD_COLLABORATOR = `
  mutation AddCollaborator($scriptId: ID!, $identifier: String!, $role: String!) {
    addCollaborator(scriptId: $scriptId, identifier: $identifier, role: $role) {
      id
    }
  }
`;

const UPDATE_COLLAB_ROLE = `
  mutation UpdateCollaboratorRole($scriptId: ID!, $targetUserId: ID!, $role: Role!) {
    updateCollaboratorRole(scriptId: $scriptId, targetUserId: $targetUserId, role: $role) {
      id
    }
  }
`;

const REMOVE_COLLAB = `
  mutation RemoveCollaborator($scriptId: ID!, $targetUserId: ID!) {
    removeCollaborator(scriptId: $scriptId, targetUserId: $targetUserId) {
      id
    }
  }
`;

const DELETE_SCRIPT = `
  mutation DeleteScript($scriptId: ID!) {
    deleteScript(scriptId: $scriptId) {
      status
    }
  }
`;

const LIKE_SCRIPT = `
  mutation LikeScript($scriptId: ID!) {
    likeScript(scriptId: $scriptId) {
      status
    }
  }
`;


describe("Script Resolvers - Complete Integration Suite", () => {
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


    describe("Script Queries - Complex Aggregations & Access Filters", () => {
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

        describe("getScriptContributors - Author Grouping Logic", () => {
            it("should group multiple paragraphs by the same author into a single contributor entry using the Map logic", async () => {
                const author = await createTestUser({ name: "Prolific Writer" });
                const authorId = author._id as mongoose.Types.ObjectId;
                const script = await createTestScript(authorId);
                const scriptId = script._id as mongoose.Types.ObjectId;

                await createTestParagraph(scriptId, authorId, { text: "Paragraph 1" });
                await createTestParagraph(scriptId, authorId, { text: "Paragraph 2" });
                await createTestParagraph(scriptId, authorId, { text: "Paragraph 3" });

                const response = await executeGraphql(GET_SCRIPT_CONTRIBUTORS, { scriptId: scriptId.toString() });

                if (response.body.errors) {
                    console.error("GraphQL Errors:", JSON.stringify(response.body.errors, null, 2));
                }

                const contributorsList = response.body.data.getScriptContributors.contributors;

                expect(contributorsList).toHaveLength(1);
                expect(contributorsList[0].userId).toBe(authorId.toString());
                expect(contributorsList[0].details.paragraphs).toHaveLength(3);
            }, 15000);
        });

        describe("getScriptById - Not Found Handling", () => {
            it("should gracefully return a GraphQL error when requesting a non-existent script ID", async () => {
                const fakeId = new mongoose.Types.ObjectId().toString();
                const response = await executeGraphql(GET_SCRIPT_BY_ID, { id: fakeId });

                expect(response.status).toBe(200);
                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Script not found");
                expect(response.body.data.getScriptById).toBeNull();
            }, 15000);
        });
    });


    describe("Script Mutations - RBAC & Security Boundaries", () => {
        describe("verifyEditorOrOwner - Role Boundaries", () => {
            it("should violently reject attempts by a VIEWER to update another user's role", async () => {
                const author = await createTestUser();
                const viewerUser = await createTestUser();
                const targetUser = await createTestUser();

                const script = await createTestScript(author._id as mongoose.Types.ObjectId);
                await Script.findByIdAndUpdate(script._id, {
                    $push: { collaborators: { user: viewerUser._id, role: "VIEWER", status: "ACCEPTED" } }
                });

                mockAuthSession(viewerUser);

                const response = await executeGraphql(UPDATE_COLLAB_ROLE, {
                    scriptId: script.id,
                    targetUserId: targetUser.id,
                    role: "EDITOR"
                });

                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Access Denied: Only Authors and Editors can perform this action.");
                expect(response.body.data).toBeNull();
            });

            it("should block an EDITOR from performing Author-only actions like deleting the script", async () => {
                const author = await createTestUser();
                const editorUser = await createTestUser();

                const script = await createTestScript(author._id as mongoose.Types.ObjectId);
                await Script.findByIdAndUpdate(script._id, {
                    $push: { collaborators: { user: editorUser._id, role: "EDITOR", status: "ACCEPTED" } }
                });

                mockAuthSession(editorUser);

                const response = await executeGraphql(DELETE_SCRIPT, { scriptId: script.id });

                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Not authorized to delete this script");
                expect(response.body.data).toBeNull();
            });
        });

        describe("Original Author Protections", () => {
            it("should prevent a rogue Editor from removing the original author (Coup D'état)", async () => {
                const author = await createTestUser();
                const editorUser = await createTestUser();

                const script = await createTestScript(author._id as mongoose.Types.ObjectId);
                await Script.findByIdAndUpdate(script._id, {
                    $push: { collaborators: { user: editorUser._id, role: "EDITOR", status: "ACCEPTED" } }
                });

                mockAuthSession(editorUser);

                const response = await executeGraphql(REMOVE_COLLAB, {
                    scriptId: script.id,
                    targetUserId: author.id
                });

                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Cannot remove the original author from the manuscript.");
            });

            it("should prevent a rogue Editor from demoting the original author", async () => {
                const author = await createTestUser();
                const editorUser = await createTestUser();

                const script = await createTestScript(author._id as mongoose.Types.ObjectId);
                await Script.findByIdAndUpdate(script._id, {
                    $push: { collaborators: { user: editorUser._id, role: "EDITOR", status: "ACCEPTED" } }
                });

                mockAuthSession(editorUser);

                const response = await executeGraphql(UPDATE_COLLAB_ROLE, {
                    scriptId: script.id,
                    targetUserId: author.id,
                    role: "VIEWER"
                });

                expect(response.body.errors).toBeDefined();
                expect(response.body.errors[0].message).toBe("Cannot change the role of the original author.");
            });
        });

        describe("Self-Interaction Exceptions", () => {
            it("should allow a low-level VIEWER to remove themselves from a script (Self-Eviction)", async () => {
                const author = await createTestUser();
                const viewerUser = await createTestUser();

                const script = await createTestScript(author._id as mongoose.Types.ObjectId);
                await Script.findByIdAndUpdate(script._id, {
                    $push: { collaborators: { user: viewerUser._id, role: "VIEWER", status: "ACCEPTED" } }
                });

                mockAuthSession(viewerUser);

                const response = await executeGraphql(REMOVE_COLLAB, {
                    scriptId: script.id,
                    targetUserId: viewerUser.id
                });

                expect(response.body.errors).toBeUndefined();
                expect(response.body.data.removeCollaborator.id).toBeDefined();
            });

            it("should safely handle double-toggle mechanics when a user likes a script twice", async () => {
                const author = await createTestUser();
                const liker = await createTestUser();
                const script = await createTestScript(author._id as mongoose.Types.ObjectId);

                mockAuthSession(liker);

                const firstResponse = await executeGraphql(LIKE_SCRIPT, { scriptId: script.id });
                expect(firstResponse.body.errors).toBeUndefined();
                expect(firstResponse.body.data.likeScript.status).toBe(true);

                const secondResponse = await executeGraphql(LIKE_SCRIPT, { scriptId: script.id });
                expect(secondResponse.body.errors).toBeUndefined();
                expect(secondResponse.body.data.likeScript.status).toBe(true);

                const updatedScript = await Script.findById(script._id);
                expect(updatedScript?.likes).toHaveLength(0);
            });
        });

        describe("Spam Invite Prevention", () => {
            it("should safely reject attempts to add a user who already has a pending invite", async () => {
                const author = await createTestUser();
                const targetUser = await createTestUser({ username: "targetuser" });
                const script = await createTestScript(author._id as mongoose.Types.ObjectId);

                mockAuthSession(author);

                await executeGraphql(ADD_COLLABORATOR, {
                    scriptId: script.id,
                    identifier: "targetuser",
                    role: "EDITOR"
                });

                const duplicateResponse = await executeGraphql(ADD_COLLABORATOR, {
                    scriptId: script.id,
                    identifier: "targetuser",
                    role: "EDITOR"
                });

                expect(duplicateResponse.body.errors).toBeDefined();
                expect(duplicateResponse.body.errors[0].message).toBe("User is already a collaborator or has a pending invite.");

                expect(duplicateResponse.body.data.addCollaborator).toBeNull();
            });
        });
    });
});