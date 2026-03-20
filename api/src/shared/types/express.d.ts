import Redis from "ioredis";
import { RequestContext } from "../core/requestcontext";
// src/shared/types/express.d.ts
import { Role } from "../../modules/identity/models/identity.models";
import { AuthPayload } from "../middleware/auth.middleware";

// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         userId: string;
//         role: Role;
//       };
//     }
//   }
// }
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
