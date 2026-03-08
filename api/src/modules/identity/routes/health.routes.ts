import { Router } from "express";
import { IdentityController } from "../controllers/identity.controllers";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

export const healthCheck = Router();

healthCheck.get("/",        IdentityController.healthCheck);


export default healthCheck;