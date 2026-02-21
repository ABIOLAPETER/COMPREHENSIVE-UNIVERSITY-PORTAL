import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "../src/modules/identity/routes/identity.routes";
import { requestContextMiddleware } from "./shared/middleware/globalContextmidlleware";
import { gatewayRateLimiter } from "./shared/middleware/rate-limiter.midlleware";
import { attachRedis } from "./shared/middleware/redis.middleware";
import { log } from "./shared/middleware/routehelper";
const app = express();



// Middlewares
app.use(cors());
app.use(express.json());


app.use(helmet());


app.use(requestContextMiddleware)
app.use(gatewayRateLimiter);
app.use(attachRedis)
app.use(log)

app.use('/v1/api/auth', authRoutes);


export default app;
