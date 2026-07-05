import http from 'http';
import cors from 'cors';
import express from 'express';
import { json } from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../../graphql/typedefs/typedefs';
import { createClient, type RedisClientType } from 'redis';
import { expressMiddleware } from '@apollo/server/express4';
import { resolvers } from '../../graphql/resolvers/resolvers';
import { connectDB, disconnectDB } from '../../database/database';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';



interface MyContext {
    req: any;
    user: any;
    redis: RedisClientType;
}

let httpServer: http.Server;
let apolloServer: ApolloServer<MyContext>;
let mongoContainer: StartedMongoDBContainer;
let redisContainer: StartedRedisContainer;
let redisClient: RedisClientType;

export const startTestServer = async (port: number = 4000): Promise<string> => {
    // 1. Spin up MongoDB
    console.log('⏳ Starting MongoDB Testcontainer...');
    mongoContainer = await new MongoDBContainer('mongo:6.0.11').start();

    let mongoUri = mongoContainer.getConnectionString();
    if (!mongoUri.includes('directConnection=true')) {
        mongoUri += mongoUri.includes('?') ? '&directConnection=true' : '?directConnection=true';
    }

    await connectDB(mongoUri);

    // 2. Spin up Redis
    console.log('⏳ Starting Redis Testcontainer...');
    redisContainer = await new RedisContainer('redis:7.4-alpine').start();

    redisClient = createClient({
        url: redisContainer.getConnectionUrl(),
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    await redisClient.connect();

    // 3. Create the app/server
    const app = express();
    httpServer = http.createServer(app);

    apolloServer = new ApolloServer<MyContext>({
        typeDefs,
        resolvers,
        formatError: (formattedError, error) => {
            console.error('🔥 RAW GRAPHQL ERROR:', error);
            return formattedError;
        },
    });

    await apolloServer.start();

    app.use(
        '/graphql',
        cors<cors.CorsRequest>(),
        json(),
        expressMiddleware(apolloServer, {
            context: async ({ req }) => {
                return {
                    req,
                    user: { id: '60c72b2f9b1d8b001c8e4a01', role: 'ADMIN' },
                    redis: redisClient,
                };
            },
        })
    );

    return new Promise((resolve) => {
        httpServer.listen(port, () => {
            console.log(`🚀 Test Server ready at http://localhost:${port}/graphql`);
            resolve(`http://localhost:${port}`);
        });
    });
};

export const stopTestServer = async () => {
    if (apolloServer) {
        await apolloServer.stop();
    }

    if (httpServer) {
        await new Promise<void>((resolve, reject) => {
            httpServer.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    if (redisClient) {
        await redisClient.quit();
    }

    await disconnectDB();

    if (redisContainer) {
        await redisContainer.stop();
        console.log('🛑 Redis Testcontainer stopped and destroyed.');
    }

    if (mongoContainer) {
        await mongoContainer.stop();
        console.log('🛑 MongoDB Testcontainer stopped and destroyed.');
    }

    console.log('🛑 Test Server stopped.');
};