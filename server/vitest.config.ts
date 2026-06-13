// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node', // Crucial for backend testing
        globals: true,       // Allows using describe/it/expect without importing them every time
        setupFiles: ['./src/tests/setup.ts'], // We will create this next
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