import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../shared/utils/redis"; // import your existing client

export const gatewayRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      const result = await redisClient.call(...(args as [string, ...string[]]));
      return result as any;
    },
  }),
});