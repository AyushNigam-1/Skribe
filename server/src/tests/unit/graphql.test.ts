import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server'; 


vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('Protected GraphQL Endpoints', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;
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

        
        const response = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'graphql_tester@example.com',
                password: 'securepassword123',
                name: 'GraphQL Tester',
                username: 'graphql_tester_1',
            });

        const rawCookies = response.headers['set-cookie'];
        authCookie = rawCookies ? (Array.isArray(rawCookies) ? rawCookies : [rawCookies]) : [];
    }, 60000); 

    afterAll(async () => {
        
        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should block an unauthenticated user from updating a profile', async () => {
        const response = await request(app)
            .post('/graphql')
            .send({
                query: `
                    mutation {
                        updateUserProfileField(key: "bio", value: "This should fail") {
                            id
                            bio
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toMatch(/unauthorized|authenticated|login/i);
    });

    it('should allow an authenticated user to update their profile', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', authCookie)
            .send({
                query: `
                    mutation {
                        updateUserProfileField(key: "bio", value: "Hello from Vitest!") {
                            name
                            bio
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.updateUserProfileField.bio).toBe('Hello from Vitest!');
        expect(response.body.data.updateUserProfileField.name).toBe('GraphQL Tester');
    });
});