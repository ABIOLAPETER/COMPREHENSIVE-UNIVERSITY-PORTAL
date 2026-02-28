

import { Router } from "express";
import { SessionController } from "../controllers/session.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";


const sessionRouter = Router();

sessionRouter.post("/", validateToken, adminMiddleware, SessionController.createSession);
sessionRouter.post("/:sessionId/activate",validateToken, adminMiddleware, SessionController.activateSession);
sessionRouter.get("/active",validateToken, SessionController.getActiveSession);
sessionRouter.get("/", validateToken, adminMiddleware, SessionController.getAllSessions);

export default sessionRouter;