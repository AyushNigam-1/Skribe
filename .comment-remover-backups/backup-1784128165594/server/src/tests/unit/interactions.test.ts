import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../../database/redis';

// Mock Socket.io so it doesn't hang the test runner
vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('User Interactions API (Likes & Views)', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;

    let userA_Cookie: string[]; // "The Liker"
    let userB_Id: string;       // "The Target"

    beforeAll(async () => {
        // 1. Boot Servers
        mongoServer = await MongoMemoryServer.create();
        redisServer = await RedisMemoryServer.create();
        process.env.MONGO_URI = mongoServer.getUri();

        const redisHost = await redisServer.getHost();
        const redisPort = await redisServer.getPort();
        process.env.REDIS_URI = `redis://${redisHost}:${redisPort}`;

        // 2. Boot App
        const main = await import('../../main');
        app = main.app;
        await main.initServer();

        // 3. Create User B (The Target Profile)
        const targetResponse = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'target@example.com',
                password: 'securepassword123',
                name: 'Target User',
                username: 'target_1',
            });
        userB_Id = targetResponse.body.user.id;

        // 4. Create User A (The Logged-in User doing the liking)
        const likerResponse = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'liker@example.com',
                password: 'securepassword123',
                name: 'Active Liker',
                username: 'liker_1',
            });

        // Capture User A's session cookie
        const rawCookies = likerResponse.headers['set-cookie'];
        userA_Cookie = rawCookies ? (Array.isArray(rawCookies) ? rawCookies : [rawCookies]) : [];
    }, 60000);

    afterAll(async () => {
        // Graceful teardown to prevent socket hanging
        await mongoose.disconnect();
        if (redisClient.isOpen) {
            await redisClient.disconnect();
        }
        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should block an unauthenticated user from liking a profile', async () => {
        const response = await request(app)
            .post('/graphql')
            // Notice: NO COOKIE ATTACHED HERE
            .send({
                query: `
                    mutation {
                        likeProfile(profileId: "${userB_Id}") {
                            success
                            message
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toMatch(/unauthorized|authenticated|login/i);
    });

    it('should allow an authenticated user to like another profile', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', userA_Cookie) // 🚨 Attach User A's cookie!
            .send({
                query: `
                    mutation {
                        likeProfile(profileId: "${userB_Id}") {
                            success
                            message
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        // Assuming your MutationResponse returns a boolean 'success' field
        // Adjust these expects if your MutationResponse shape is different!
        expect(response.body.data.likeProfile.success).toBe(true);
    });

    it('should accurately reflect the new like in the target user\'s profile data', async () => {
        // Now we query User B to see if their 'likes' array increased!
        const response = await request(app)
            .post('/graphql')
            .send({
                query: `
                    query {
                        getUserProfile(id: "${userB_Id}") {
                            id
                            likes
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const likesArray = response.body.data.getUserProfile.likes;
        expect(Array.isArray(likesArray)).toBe(true);
        expect(likesArray.length).toBeGreaterThan(0); // Proves the like was saved to the DB!
    });
});