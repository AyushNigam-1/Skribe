import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../../database/redis';

vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('Paragraph Review & Interaction API', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;

    let ownerCookie: string[];
    let contributorCookie: string[];

    let scriptId: string;
    let paragraphId: string;

    beforeAll(async () => {
        
        mongoServer = await MongoMemoryServer.create();
        redisServer = await RedisMemoryServer.create();
        process.env.MONGO_URI = mongoServer.getUri();
        const redisHost = await redisServer.getHost();
        const redisPort = await redisServer.getPort();
        process.env.REDIS_URI = `redis://${redisHost}:${redisPort}`;

        const main = await import('../../main');
        app = main.app;
        await main.initServer();

        
        const ownerRes = await request(app).post('/api/auth/sign-up/email').send({
            email: 'editor_owner@example.com', password: 'securepassword123', name: 'Script Owner', username: 'editor_1'
        });
        const rawOwnerCookies = ownerRes.headers['set-cookie'];
        ownerCookie = rawOwnerCookies ? (Array.isArray(rawOwnerCookies) ? rawOwnerCookies : [rawOwnerCookies]) : [];

        
        const contribRes = await request(app).post('/api/auth/sign-up/email').send({
            email: 'writer_contrib@example.com', password: 'securepassword123', name: 'Script Writer', username: 'writer_1'
        });
        const rawContribCookies = contribRes.headers['set-cookie'];
        contributorCookie = rawContribCookies ? (Array.isArray(rawContribCookies) ? rawContribCookies : [rawContribCookies]) : [];

        
        const scriptRes = await request(app)
            .post('/graphql')
            .set('Cookie', ownerCookie)
            .send({
                query: `mutation { createScript(title: "The Great Collab", visibility: "Public", languages: ["English"], genres: ["Drama"], description: "Test") { id } }`
            });
        scriptId = scriptRes.body.data.createScript.id;
    }, 60000);

    afterAll(async () => {
        await mongoose.disconnect();
        if (redisClient.isOpen) await redisClient.disconnect();
        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should allow a contributor to submit a paragraph for review', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', contributorCookie) 
            .send({
                query: `
                    mutation {
                        submitParagraph(scriptId: "${scriptId}", text: "The spaceship doors opened slowly.") {
                            id
                            text
                            status
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const paragraph = response.body.data.submitParagraph;
        expect(paragraph.text).toBe("The spaceship doors opened slowly.");

        
        paragraphId = paragraph.id;
    });

    it('should allow the owner to fetch pending paragraphs for their script', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', ownerCookie) 
            .send({
                query: `
                    query {
                        getPendingParagraphs(scriptId: "${scriptId}") {
                            id
                            text
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const pendingQueue = response.body.data.getPendingParagraphs;
        expect(Array.isArray(pendingQueue)).toBe(true);
        
        expect(pendingQueue.some((p: any) => p.id === paragraphId)).toBe(true);
    });

    it('should allow the owner to approve the pending paragraph', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', ownerCookie) 
            .send({
                query: `
                    mutation {
                        approveParagraph(paragraphId: "${paragraphId}") {
                            status
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.approveParagraph.status).toBe(true);
    });

    it('should allow a user to comment on an approved paragraph', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', ownerCookie) 
            .send({
                query: `
                    mutation {
                        addComment(paragraphId: "${paragraphId}", text: "Great opening line!") {
                            id
                            comments {
                                text
                                author {
                                    name
                                }
                            }
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const comments = response.body.data.addComment.comments;
        expect(comments.length).toBeGreaterThan(0);
        expect(comments[0].text).toBe("Great opening line!");
        expect(comments[0].author.name).toBe("Script Owner");
    });

    it('should allow the author of the paragraph to edit it', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', contributorCookie) 
            .send({
                query: `
                    mutation {
                        editParagraph(paragraphId: "${paragraphId}", text: "The rusted spaceship doors opened slowly with a loud screech.") {
                            id
                            text
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.editParagraph.text).toContain("rusted");
    });
});