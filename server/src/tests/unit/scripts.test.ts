import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../../database/redis';

vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('Script Core API (Create, Read, Update, Delete)', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;

    let authorCookie: string[];
    let createdScriptId: string;

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

        const authResponse = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'author@example.com',
                password: 'securepassword123',
                name: 'Script Author',
                username: 'author_1',
            });

        const rawCookies = authResponse.headers['set-cookie'];
        authorCookie = rawCookies ? (Array.isArray(rawCookies) ? rawCookies : [rawCookies]) : [];
    }, 60000);

    afterAll(async () => {
        await mongoose.disconnect();
        if (redisClient.isOpen) await redisClient.disconnect();
        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should block an unauthenticated user from creating a script', async () => {
        const response = await request(app)
            .post('/graphql')
            .send({
                query: `
                    mutation {
                        createScript(
                            title: "Hacked Script", 
                            visibility: "Public", 
                            languages: ["English"], 
                            genres: ["Sci-Fi"], 
                            description: "This should fail"
                        ) {
                            id
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toMatch(/unauthorized|authenticated|login/i);
    });

    it('should allow an authenticated user to create a script', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authorCookie)
            .send({
                query: `
                    mutation {
                        createScript(
                            title: "My First Masterpiece", 
                            visibility: "Public", 
                            languages: ["English", "Spanish"], 
                            genres: ["Fantasy", "Action"], 
                            description: "An epic tale of debugging."
                        ) {
                            id
                            title
                            author {
                                name
                            }
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const script = response.body.data.createScript;
        expect(script.title).toBe("My First Masterpiece");
        expect(script.author.name).toBe("Script Author");
        createdScriptId = script.id;
    });

    it('should fetch the newly created script by ID', async () => {
        const response = await request(app)
            .post('/graphql')
            .send({
                query: `
                    query {
                        getScriptById(id: "${createdScriptId}") {
                            id
                            title
                            description
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.getScriptById.title).toBe("My First Masterpiece");
    });

    it('should allow the author to update the script details', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authorCookie)
            .send({
                query: `
                    mutation {
                        updateScript(
                            scriptId: "${createdScriptId}",
                            title: "My Revised Masterpiece"
                        ) {
                            id
                            title
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.updateScript.title).toBe("My Revised Masterpiece");
    });

    it('should successfully delete the script', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authorCookie)
            .send({
                query: `
                    mutation {
                        deleteScript(scriptId: "${createdScriptId}") {
                            status
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.deleteScript.status).toBe(true);

        const verifyResponse = await request(app)
            .post('/graphql')
            .send({
                query: `
                    query {
                        getScriptById(id: "${createdScriptId}") {
                            id
                        }
                    }
                `
            });

        if (verifyResponse.body.errors) {
            expect(verifyResponse.body.errors).toBeDefined();
        } else {
            expect(verifyResponse.body.data.getScriptById).toBeNull();
        }
    });
});