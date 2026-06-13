import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// 1. Mock the Redis Client
vi.mock('../database/redis', () => ({
    redisClient: {
        connect: vi.fn().mockResolvedValue(true),
        sendCommand: vi.fn().mockResolvedValue(true),
    }
}));

// 2. Mock the Rate Limiter Store
vi.mock('rate-limit-redis', () => {
    return {
        default: class MockStore {
            async increment() { return { totalHits: 1, resetTime: new Date() }; }
            async decrement() { }
            async resetKey() { }
        }
    };
});

// 3. Mock Socket.io
vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

// 🚨 REMOVED the static import of 'app' from here!

describe('API Tests', () => {
    let mongoServer: MongoMemoryServer;
    let app: any; // 🚨 Declare app here so all tests can use it

    beforeAll(async () => {
        // 1. Start the RAM database FIRST
        mongoServer = await MongoMemoryServer.create();

        // 2. Override the environment variable
        process.env.MONGO_URI = mongoServer.getUri();

        // 3. NOW dynamically import everything so Better Auth gets the real URI
        const main = await import('../main');
        app = main.app; // Assign the app
        await main.initServer(); // Boot the server
    }, 60000);

    afterAll(async () => {
        // Clean up and destroy the RAM database after tests finish
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    it('should return 200 for Better Auth session endpoint', async () => {
        const response = await request(app).get('/api/auth/get-session');
        expect(response.status).toBe(200);
    });

    it('should have the GraphQL endpoint accessible', async () => {
        const response = await request(app)
            .post('/graphql')
            .send({
                query: '{ __schema { queryType { name } } }'
            });

        expect(response.status).toBe(200);
    });

    it('should successfully register a new user and return a session cookie', async () => {
        // 1. Send the exact payload your frontend CreateAccount.tsx sends
        const response = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'test_writer@example.com',
                password: 'securepassword123',
                name: 'Test Writer',
                username: 'test_writer_1',
            });

        // 2. Expect a 200 OK response
        expect(response.status).toBe(200);

        // 3. Verify the database actually created and returned the user data
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe('test_writer@example.com');
        expect(response.body.user.name).toBe('Test Writer');

        // 4. CRITICAL: Verify Better Auth attached the secure HTTP-only session cookie
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();

        // Force it into an array just in case it returns a single string
        const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
        expect(cookieArray.some((cookie: string) => cookie.includes('better-auth.session_token'))).toBe(true);
    }, 15000);
    it('should reject registration if the email is already in use', async () => {
        // 1. We attempt to register the EXACT SAME user from the previous test
        const response = await request(app)
            .post('/api/auth/sign-up/email')
            .send({
                email: 'test_writer@example.com', // 🚨 Already exists!
                password: 'anotherpassword456',
                name: 'Imposter Writer',
                username: 'imposter_1',
            });

        // 2. Better Auth should catch this and return a 400 Bad Request (not a 500 server crash)
        expect(response.status).toBe(422);
        // 3. Verify it sends back a clear error message
        expect(response.body.message).toBeDefined();

        // Better Auth usually returns "User already exists" or something similar
        expect(response.body.message).toMatch(/already exists|in use/i);
    });
});