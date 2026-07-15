import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../../database/redis';

vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('User Profile & Search API', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;
    let targetUserId: string;
    let authCookie: string[];

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

        
        const targetResponse = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'searchable@example.com',
                password: 'securepassword123',
                name: 'John Doe',
                username: 'johndoe_1',
            });
        targetUserId = targetResponse.body.user.id;

        
        const searcherResponse = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'searcher@example.com',
                password: 'securepassword123',
                name: 'Searcher Jane',
                username: 'jane_1',
            });

        
        const rawCookies = searcherResponse.headers['set-cookie'];
        authCookie = rawCookies ? (Array.isArray(rawCookies) ? rawCookies : [rawCookies]) : [];
    }, 60000);

    afterAll(async () => {
        await mongoose.disconnect();
        if (redisClient.isOpen) {
            await redisClient.disconnect();
        }

        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should fetch a specific user profile by ID', async () => {
        const response = await request(app)
            .post('/graphql')
            .send({
                query: `
                    query {
                        getUserProfile(id: "${targetUserId}") {
                            id
                            name
                            email
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.getUserProfile.name).toBe('John Doe');
        expect(response.body.data.getUserProfile.email).toBe('searchable@example.com');
    });

    it('should return an error when requesting a non-existent profile ID', async () => {
        const fakeId = "60c72b2f9b1d8b001c8e4b99";

        const response = await request(app)
            .post('/graphql')
            .send({
                query: `
                    query {
                        getUserProfile(id: "${fakeId}") {
                            id
                            name
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
    });

    it('should successfully find users using the searchUsers query', async () => {
        
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authCookie)
            .send({
                query: `
                    query {
                        searchUsers(query: "John") {
                            id
                            name
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const searchResults = response.body.data.searchUsers;
        expect(Array.isArray(searchResults)).toBe(true);
        expect(searchResults.length).toBeGreaterThan(0);
        expect(searchResults[0].name).toBe('John Doe');
    });
});