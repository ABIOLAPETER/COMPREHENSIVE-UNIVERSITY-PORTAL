import { NextFunction, Request, Response } from "express"
import { logger } from "../utils/logger";

export const log = (req: Request, res: Response, next: NextFunction) => {
    logger.info(`Received ${req.method} ${req.url}`);
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
    next();
}