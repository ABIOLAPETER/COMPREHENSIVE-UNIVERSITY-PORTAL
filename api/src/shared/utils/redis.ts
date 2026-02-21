import Redis from "ioredis";
import { env } from "../../config/env";

export const redisClient = new Redis(env.REDIS_URL);

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

redisClient.on("error", (err: Error) => {
  console.error("❌ Redis error", err);
});