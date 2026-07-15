import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../../database/redis';


vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('User Interactions API (Likes & Views)', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;

    let userA_Cookie: string[]; 
    let userB_Id: string;       

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
                email: 'target@example.com',
                password: 'securepassword123',
                name: 'Target User',
                username: 'target_1',
            });
        userB_Id = targetResponse.body.user.id;

        
        const likerResponse = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'liker@example.com',
                password: 'securepassword123',
                name: 'Active Liker',
                username: 'liker_1',
            });

        
        const rawCookies = likerResponse.headers['set-cookie'];
        userA_Cookie = rawCookies ? (Array.isArray(rawCookies) ? rawCookies : [rawCookies]) : [];
    }, 60000);

    afterAll(async () => {
        
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
            .set('Cookie', userA_Cookie) 
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

        
        
        expect(response.body.data.likeProfile.success).toBe(true);
    });

    it('should accurately reflect the new like in the target user\'s profile data', async () => {
        
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
        expect(likesArray.length).toBeGreaterThan(0); 
    });
});