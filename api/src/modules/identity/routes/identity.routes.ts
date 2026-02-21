import { Router } from "express";

import { IdentityController } from "../controllers/identity.controllers"

export const identityRouter = Router();

identityRouter.post("/signup", IdentityController.signup);
identityRouter.post("/login", IdentityController.login);
identityRouter.post("/refresh-token", IdentityController.refreshToken);
identityRouter.post("/logout", IdentityController.logout);

export default identityRouter;
