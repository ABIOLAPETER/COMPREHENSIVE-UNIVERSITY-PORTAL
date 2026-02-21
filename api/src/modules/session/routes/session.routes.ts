

import { Router } from "express";
import { SessionController } from "../controllers/session.controller";
import { validateToken } from "../../../shared/middleware/auth.middleware";


const router = Router();

router.post("/", validateToken, SessionController.createSession);
router.post("/:sessionId/activate",validateToken, SessionController.activateSession);
router.get("/active",validateToken, SessionController.getActiveSession);
router.get("/", validateToken, SessionController.getAllSessions);

export default router;