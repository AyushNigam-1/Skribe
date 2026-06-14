import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../database/redis';

vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('Script Collaboration & Content API', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;

    let authorCookie: string[];
    let collabCookie: string[];

    let scriptId: string;
    let collabUserId: string;
    const collabEmail = 'collab_writer@example.com';

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        redisServer = await RedisMemoryServer.create();
        process.env.MONGO_URI = mongoServer.getUri();

        const redisHost = await redisServer.getHost();
        const redisPort = await redisServer.getPort();
        process.env.REDIS_URI = `redis://${redisHost}:${redisPort}`;

        const main = await import('../main');
        app = main.app;
        await main.initServer();

        // 1. Create User A (The Script Owner)
        const authResponse = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'script_owner@example.com',
                password: 'securepassword123',
                name: 'Script Owner',
                username: 'owner_1'
            });
        const rawAuthorCookies = authResponse.headers['set-cookie'];
        authorCookie = rawAuthorCookies ? (Array.isArray(rawAuthorCookies) ? rawAuthorCookies : [rawAuthorCookies]) : [];

        // 2. Create User B (The Collaborator)
        const collabResponse = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: collabEmail,
                password: 'securepassword123',
                name: 'Collab User',
                username: 'collab_1'
            });
        collabUserId = collabResponse.body.user.id;
        const rawCollabCookies = collabResponse.headers['set-cookie'];
        collabCookie = rawCollabCookies ? (Array.isArray(rawCollabCookies) ? rawCollabCookies : [rawCollabCookies]) : [];

        // 3. User A creates a Private Script for us to test on
        const scriptRes = await request(app)
            .post('/graphql')
            .set('Cookie', authorCookie)
            .send({
                query: `
                    mutation { 
                        createScript(title: "Top Secret Collab", visibility: "Private", languages: ["English"], genres: ["Action"], description: "Testing collabs") { 
                            id 
                        } 
                    }
                `
            });
        scriptId = scriptRes.body.data.createScript.id;
    }, 60000);

    afterAll(async () => {
        await mongoose.disconnect();
        if (redisClient.isOpen) await redisClient.disconnect();
        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should allow the author to submit a paragraph to the script', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authorCookie)
            .send({
                query: `
                    mutation {
                        submitParagraph(scriptId: "${scriptId}", text: "It was a dark and stormy night...") {
                            id
                            text
                            author {
                                name
                            }
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.submitParagraph.text).toBe("It was a dark and stormy night...");
        expect(response.body.data.submitParagraph.author.name).toBe("Script Owner");
    });

    it('should allow the author to invite a collaborator via email', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authorCookie)
            .send({
                query: `
                    mutation {
                        addCollaborator(scriptId: "${scriptId}", identifier: "${collabEmail}", role: "EDITOR") {
                            id
                            collaborators {
                                status
                                role
                            }
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        // Ensure the collaborator was added and is in a PENDING state
        const addedCollab = response.body.data.addCollaborator.collaborators[0];
        expect(addedCollab.status).toMatch(/PENDING/i);
        expect(addedCollab.role).toBe("EDITOR");
    });

    it('should allow the invited user to accept the collaboration request', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', collabCookie) // 🚨 Executed as the Collaborator!
            .send({
                query: `
                    mutation {
                        acceptInvitation(scriptId: "${scriptId}") {
                            id
                            collaborators {
                                status
                            }
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        // Ensure the status changed to ACCEPTED
        const acceptedCollab = response.body.data.acceptInvitation.collaborators.find((c: any) => c.status === 'ACCEPTED');
        expect(acceptedCollab).toBeDefined();
    });

    it('should allow the author to remove the collaborator', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authorCookie) // 🚨 Back to the Author
            .send({
                query: `
                    mutation {
                        removeCollaborator(scriptId: "${scriptId}", targetUserId: "${collabUserId}") {
                            id
                            collaborators {
                                role
                            }
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        // The collaborators array should now be empty (or not contain the target user)
        const collaborators = response.body.data.removeCollaborator.collaborators || [];
        expect(collaborators.length).toBe(0);
    });
});