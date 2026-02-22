

import { Router } from "express";
import { SessionController } from "../controllers/session.controller";
import { validateToken } from "../../../shared/middleware/auth.middleware";


const sessionRouter = Router();

sessionRouter.post("/", validateToken, SessionController.createSession);
sessionRouter.post("/:sessionId/activate",validateToken, SessionController.activateSession);
sessionRouter.get("/active",validateToken, SessionController.getActiveSession);
sessionRouter.get("/", validateToken, SessionController.getAllSessions);

export default sessionRouter;