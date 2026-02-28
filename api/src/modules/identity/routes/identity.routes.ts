import { Router } from "express";

import { IdentityController } from "../controllers/identity.controllers"
import { adminMiddleware, validateToken } from "../../../shared/middleware/auth.middleware";

export const identityRouter = Router();

identityRouter.post("/signup", IdentityController.signup);
identityRouter.post("/login", IdentityController.login);
identityRouter.post("/refresh-token", IdentityController.refreshToken);
identityRouter.post("/logout", IdentityController.logout);
identityRouter.get('/',validateToken, adminMiddleware, IdentityController.getUsers)
export default identityRouter;
