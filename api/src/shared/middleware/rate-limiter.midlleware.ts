import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Redis } from "ioredis";

const redisClient = new Redis();

export const gatewayRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      const result = await redisClient.call(...(args as [string, ...string[]]));
      return result as any; // Type assertion to satisfy RedisStore
    },
  }),
});


