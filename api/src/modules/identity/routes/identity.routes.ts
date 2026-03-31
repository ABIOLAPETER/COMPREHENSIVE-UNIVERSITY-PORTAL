import { Router } from "express";
import { IdentityController } from "../controllers/identity.controllers";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

export const identityRouter = Router();


identityRouter.post("/activate",        IdentityController.accountActivation);
identityRouter.post("/login",         IdentityController.login);

identityRouter.post("/refresh", IdentityController.refreshToken);

identityRouter.post("/logout",        IdentityController.logout);
identityRouter.get("/users", validateToken, adminMiddleware, IdentityController.getUsers);
identityRouter.patch("/change-password", validateToken, IdentityController.changePassword);
identityRouter.post("/logout-all", validateToken, adminMiddleware, IdentityController.logOutAll);

export default identityRouter;