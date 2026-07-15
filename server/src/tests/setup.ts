
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
    
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.MONGO_URI = 'mongodb://localhost:27017/skribe_test_db';

    
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.BASE_URL = 'http://localhost:3000';
});

afterAll(() => {
    
});