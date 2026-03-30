import { Router } from "express";
import { GPAController } from "../controllers/gpa.controller";
import { validateToken } from "../../../shared/middleware/auth.middleware";

const gpaRouter = Router();

gpaRouter.get('/my-gpa', validateToken, GPAController.getGpa)

export default gpaRouter