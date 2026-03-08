import { Router } from "express";
import { IdentityController } from "../controllers/identity.controllers";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

export const identityRouter = Router();


identityRouter.post("/signup",        IdentityController.signup);
identityRouter.post("/login",         IdentityController.login);

// FIX: no validateToken here — the entire point of this route is that
// the access token is EXPIRED. Requiring it would make refresh impossible.
identityRouter.post("/refresh", IdentityController.refreshToken);

// FIX: no validateToken here either — the access token may already be
// expired when the user logs out. Only the httpOnly cookie is needed.
identityRouter.post("/logout",        IdentityController.logout);


// Admin only — get all users
identityRouter.get("/users", validateToken, adminMiddleware, IdentityController.getUsers);

export default identityRouter;