// tests/setup.ts
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
    // Override environment variables for tests
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.MONGO_URI = 'mongodb://localhost:27017/skribe_test_db';

    // 🚨 FIX: Give Better Auth a valid fake URL so it doesn't crash
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.BASE_URL = 'http://localhost:3000';
});

afterAll(() => {
    // Clean up after tests finish
});