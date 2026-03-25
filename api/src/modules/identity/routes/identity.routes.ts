import { Router } from "express";
import { IdentityController } from "../controllers/identity.controllers";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

export const identityRouter = Router();


identityRouter.post("/activate",        IdentityController.accountActivation);
identityRouter.post("/login",         IdentityController.login);

identityRouter.post("/refresh", IdentityController.refreshToken);

identityRouter.post("/logout",        IdentityController.logout);
identityRouter.get("/users", validateToken, adminMiddleware, IdentityController.getUsers);

export default identityRouter;