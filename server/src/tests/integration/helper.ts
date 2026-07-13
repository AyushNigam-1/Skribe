import request from "supertest";
import { MongoDBContainer } from "@testcontainers/mongodb";
import { RedisContainer } from "@testcontainers/redis";
import mongoose from "mongoose";

let mongoContainer: any;
let redisContainer: any;
let app: any;
let redisClient: any;

export const startTestInfrastructure = async () => {
    // 1. Boot the ephemeral Docker containers
    mongoContainer = await new MongoDBContainer("mongo:6.0").start();
    redisContainer = await new RedisContainer("redis:7.2").start();

    // 2. Override environment variables BEFORE the server loads
    process.env.MONGO_URI = mongoContainer.getConnectionString();
    process.env.REDIS_URL = redisContainer.getConnectionUrl();
    process.env.NODE_ENV = "test"; // Prevents the server from binding to a physical port

    // 3. Dynamically import your server and database connections
    const serverModule = await import("../../main"); // Adjust path to your server.ts
    const redisModule = await import("../../database/redis");

    app = serverModule.app;
    redisClient = redisModule.redisClient;

    // 4. Initialize the Express application
    await serverModule.initServer();
};

export const stopTestInfrastructure = async () => {
    await mongoose.disconnect();
    if (redisClient?.isOpen) await redisClient.disconnect();

    if (mongoContainer) await mongoContainer.stop();
    if (redisContainer) await redisContainer.stop();
};

export const clearDatabases = async () => {
    if (redisClient?.isOpen) await redisClient.flushAll();

    if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.collections();
        for (const collection of collections) {
            await collection.deleteMany({});
        }
    }
};

/**
 * Reusable Supertest helper to execute GraphQL queries against the real Express route
 */
export const executeGraphql = async (
    query: string,
    variables: Record<string, any> = {},
    cookies: string[] = [] // Optional: Pass mocked session cookies here
) => {
    const req = request(app)
        .post("/graphql")
        .set("x-test-name", "Integration-Blackbox-Test")
        .send({ query, variables });

    if (cookies.length > 0) {
        req.set("Cookie", cookies);
    }

    return req;
};