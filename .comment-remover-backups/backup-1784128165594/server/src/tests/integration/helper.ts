import request from "supertest";
import { MongoDBContainer } from "@testcontainers/mongodb";
import { RedisContainer } from "@testcontainers/redis";
import mongoose from "mongoose";

let mongoContainer: any;
let redisContainer: any;
let app: any;
let redisClient: any;

export const startTestInfrastructure = async () => {
    mongoContainer = await new MongoDBContainer("mongo:6.0").start();
    redisContainer = await new RedisContainer("redis:7.2").start();

    let mongoUri = mongoContainer.getConnectionString();

    mongoUri = mongoUri.replace("localhost", "127.0.0.1");

    const separator = mongoUri.includes("?") ? "&" : "?";
    mongoUri = `${mongoUri}${separator}directConnection=true`;

    process.env.MONGO_URI = mongoUri;
    process.env.REDIS_URL = redisContainer.getConnectionUrl().replace("localhost", "127.0.0.1");
    process.env.NODE_ENV = "test";

    const serverModule = await import("../../main");
    const redisModule = await import("../../database/redis");

    app = serverModule.app;
    redisClient = redisModule.redisClient;

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


export const executeGraphql = async (query: string, variables: any = {}, token?: string) => {
    const requestBuilder = request(app).post("/graphql").send({ query, variables });

    if (token) {
        requestBuilder.set("Cookie", `better-auth.session_token=${token}`);
    }

    return await requestBuilder;
};