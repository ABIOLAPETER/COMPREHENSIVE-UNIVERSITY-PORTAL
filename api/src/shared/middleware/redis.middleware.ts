
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../utils/redis";

export const attachRedis = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.redisClient = redisClient;
  next();
};
