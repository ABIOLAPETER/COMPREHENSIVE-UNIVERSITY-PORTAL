import Redis from "ioredis";
import { RequestContext } from "../core/requestcontext";

declare global {
    namespace Express {
        interface Request {
            redisClient: Redis,
            context: RequestContext;
            user?: AuthPayload;
        }
    }
}



export { };
