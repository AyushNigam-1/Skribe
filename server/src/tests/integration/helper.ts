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

    // 2. Format the connection string to bypass Docker DNS issues
    let mongoUri = mongoContainer.getConnectionString();

    // Replace localhost with 127.0.0.1 to avoid Node IPv6 resolution issues
    mongoUri = mongoUri.replace("localhost", "127.0.0.1");

    // Force Mongoose to connect directly to the mapped port, ignoring internal Replica Set hostnames
    const separator = mongoUri.includes("?") ? "&" : "?";
    mongoUri = `${mongoUri}${separator}directConnection=true`;

    // 3. Override environment variables BEFORE the server loads
    process.env.MONGO_URI = mongoUri;
    process.env.REDIS_URL = redisContainer.getConnectionUrl().replace("localhost", "127.0.0.1");
    process.env.NODE_ENV = "test";

    // 4. Dynamically import your server and database connections
    const serverModule = await import("../../main"); // Update to match your actual server entry point (main.ts)
    const redisModule = await import("../../database/redis");

    app = serverModule.app;
    redisClient = redisModule.redisClient;

    // 5. Initialize the Express application
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