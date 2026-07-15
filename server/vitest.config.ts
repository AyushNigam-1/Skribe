import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node', 
        globals: true,       
        setupFiles: ['./src/tests/setup.ts', './src/utils/instrumentation.ts'], 
        include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
        env: {
            BETTER_AUTH_URL: 'http://localhost:3000',
            BASE_URL: 'http://localhost:3000',
            NODE_ENV: 'test',
            PORT: '3001',
            MONGO_URI: 'mongodb://localhost:27017/skribe_test_db',
        }
    },
});