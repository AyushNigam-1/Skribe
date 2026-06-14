import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../database/redis';

vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('Content Discovery & Bookmarks API', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;

    let authorCookie: string[];
    let authorId: string;

    let readerCookie: string[];
    let readerId: string;

    let publicScriptId: string;
    let privateScriptId: string;

    beforeAll(async () => {
        // 1. Boot Servers
        mongoServer = await MongoMemoryServer.create();
        redisServer = await RedisMemoryServer.create();
        process.env.MONGO_URI = mongoServer.getUri();
        const redisHost = await redisServer.getHost();
        const redisPort = await redisServer.getPort();
        process.env.REDIS_URI = `redis://${redisHost}:${redisPort}`;

        const main = await import('../main');
        app = main.app;
        await main.initServer();

        // 2. Create User A (The Author)
        const authorRes = await request(app).post('/api/auth/sign-up/email').send({
            email: 'prolific_author@example.com', password: 'securepassword123', name: 'Prolific Author', username: 'author_99'
        });
        authorId = authorRes.body.user.id;
        const rawAuthorCookies = authorRes.headers['set-cookie'];
        authorCookie = rawAuthorCookies ? (Array.isArray(rawAuthorCookies) ? rawAuthorCookies : [rawAuthorCookies]) : [];

        // 3. Create User B (The Reader)
        const readerRes = await request(app).post('/api/auth/sign-up/email').send({
            email: 'avid_reader@example.com', password: 'securepassword123', name: 'Avid Reader', username: 'reader_99'
        });
        readerId = readerRes.body.user.id;
        const rawReaderCookies = readerRes.headers['set-cookie'];
        readerCookie = rawReaderCookies ? (Array.isArray(rawReaderCookies) ? rawReaderCookies : [rawReaderCookies]) : [];

        // 4. Author creates a PUBLIC script
        const pubScriptRes = await request(app).post('/graphql').set('Cookie', authorCookie).send({
            query: `mutation { createScript(title: "Public Masterpiece", visibility: "Public", languages: ["English"], genres: ["Fantasy"], description: "Everyone can read this") { id } }`
        });
        publicScriptId = pubScriptRes.body.data.createScript.id;

        // 5. Author creates a PRIVATE script
        const privScriptRes = await request(app).post('/graphql').set('Cookie', authorCookie).send({
            query: `mutation { createScript(title: "Secret Diary", visibility: "Private", languages: ["English"], genres: ["Drama"], description: "No one can read this") { id } }`
        });
        privateScriptId = privScriptRes.body.data.createScript.id;
    }, 60000);

    afterAll(async () => {
        await mongoose.disconnect();
        if (redisClient.isOpen) await redisClient.disconnect();
        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should allow the author to see BOTH their public and private scripts', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authorCookie) // 🚨 Queried by the Author
            .send({
                query: `
                    query {
                        getUserScripts(userId: "${authorId}") {
                            id
                            title
                            visibility
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const scripts = response.body.data.getUserScripts;
        expect(scripts.length).toBe(2);
        expect(scripts.some((s: any) => s.id === publicScriptId)).toBe(true);
        expect(scripts.some((s: any) => s.id === privateScriptId)).toBe(true);
    });

    it('should hide private scripts when a different user fetches the author\'s scripts', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', readerCookie) // 🚨 Queried by the Reader
            .send({
                query: `
                    query {
                        getUserScripts(userId: "${authorId}") {
                            id
                            title
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const scripts = response.body.data.getUserScripts;
        // The reader should only see 1 script (the public one)
        expect(scripts.length).toBe(1);
        expect(scripts[0].id).toBe(publicScriptId);
        expect(scripts[0].id).not.toBe(privateScriptId);
    });

    it('should allow the reader to bookmark the public script', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', readerCookie) // 🚨 Reader bookmarks it
            .send({
                query: `
                    mutation {
                        toggleBookmark(scriptId: "${publicScriptId}") {
                            status
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.toggleBookmark.status).toBe(true);
    });

    it('should accurately retrieve the reader\'s bookmarked favourites', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', readerCookie)
            .send({
                query: `
                    query {
                        getUserFavourites(userId: "${readerId}") {
                            id
                            title
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const favourites = response.body.data.getUserFavourites;
        expect(favourites.length).toBe(1);
        expect(favourites[0].id).toBe(publicScriptId);
        expect(favourites[0].title).toBe("Public Masterpiece");
    });
});