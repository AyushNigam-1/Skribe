import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';

// Mock Socket.io
vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('Security & Rate Limiting', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;

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
    }, 60000);

    afterAll(async () => {
        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should allow normal GraphQL traffic (under limit)', async () => {
        const res = await request(app)
            .post('/graphql')
            .send({ query: '{ __schema { queryType { name } } }' });

        expect(res.status).toBe(200);
    });

    it('should block requests that exceed the rate limit (100 reqs / 15 min)', async () => {
        // 🚨 Fire 100 requests rapidly simultaneously using Promise.all
        const requests = Array.from({ length: 100 }).map(() =>
            request(app)
                .post('/graphql')
                .send({ query: '{ __schema { queryType { name } } }' })
        );

        await Promise.all(requests);

        // 🚨 The 101st request should be intercepted by the Redis Rate Limiter
        const blockedRes = await request(app)
            .post('/graphql')
            .send({ query: '{ __schema { queryType { name } } }' });

        // Express-rate-limit defaults to returning a 429 Too Many Requests status
        expect(blockedRes.status).toBe(429);

        // Verify it returns the custom message you wrote in main.ts
        expect(blockedRes.body.errors[0].extensions.code).toBe('TOO_MANY_REQUESTS');
        expect(blockedRes.body.errors[0].message).toMatch(/Too many requests/i);
    }, 30000); // Give this test extra time since it makes 100 network requests
});