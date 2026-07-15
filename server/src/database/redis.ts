
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();


export const getRedisClient = () => {
  const redisUri = process.env.REDIS_URI || "redis://localhost:6379";

  const client = createClient({
    url: redisUri,
  });

  client.on("error", (err) => console.error("Redis Client Error", err));
  return client;
};


let clientInstance: ReturnType<typeof createClient> | null = null;

export const redisClient = new Proxy({} as ReturnType<typeof createClient>, {
  get: (target, prop) => {
    if (!clientInstance) {
      clientInstance = getRedisClient();
    }
    return (clientInstance as any)[prop];
  }
});