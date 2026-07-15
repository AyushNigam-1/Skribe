import { connectDB } from "./database/database";
import express from "express";
import { createServer } from "http";
import { expressMiddleware } from "@apollo/server/express4";
import dotenv from "dotenv";
import { graphqlServer } from "./graphql/server";
import cors from "cors";
import cookieParser from "cookie-parser";
import { redisClient } from "./database/redis";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth";
import pino from "pino";
import pinoHttp from "pino-http";
import helmet from "helmet";
import { z } from "zod";
import { initSocket } from "./utils/socket";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("7860"),
  MONGO_URI: z.url(),
  FRONTEND_URL: z.url().default("http://localhost:5173"),
  BETTER_AUTH_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
});

const envParsed = envSchema.safeParse(process.env);
if (!envParsed.success) {
  console.error("❌ Invalid environment variables:", envParsed.error.format());
  process.exit(1);
}
const env = envParsed.data;
const isDev = env.NODE_ENV !== "production";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isDev
    ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname,req,res,responseTime",
        messageFormat: "{msg}",
      },
    }
    : undefined,
});


export const app = express();
export const httpServer = createServer(app);


export const initServer = async () => {
  try {
    const activeMongoUri = process.env.MONGO_URI || env.MONGO_URI;

    await connectDB(activeMongoUri);
    await redisClient.connect();
    logger.info("✅ Database and Redis connected successfully");
  } catch (err) {
    logger.error({ err }, "❌ Failed to connect to backing services");
    process.exit(1);
  }

  app.set("trust proxy", 1);
  initSocket(httpServer);

  const server = graphqlServer();
  await server.start();

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: isDev ? false : undefined,
    })
  );

  app.use(pinoHttp({ logger }));
  app.use(cookieParser());
  app.use(express.json());

  app.use(
    cors({
      origin: [env.FRONTEND_URL, "http://localhost:5173"],
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
    }),
  );

  app.use("/api/auth/", toNodeHandler(auth));

  const graphqlLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      errors: [
        {
          message: "Too many requests from this IP. Try again in 15 mins.",
          extensions: { code: "TOO_MANY_REQUESTS" },
        },
      ],
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(
    "/graphql",
    graphqlLimiter,
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });

        return {
          req,
          res,
          user: session?.user || null,
          session: session?.session || null,
          redis: redisClient,
        };
      },
    }),
  );

  return app;
};


if (env.NODE_ENV !== "test") {
  initServer().then(() => {
    const port = Number(env.PORT);
    httpServer.listen(port, "0.0.0.0", () => {
      logger.info(`🚀 HTTP & Socket.io Server started on port ${port} in ${env.NODE_ENV} mode`);
    });
  });
}