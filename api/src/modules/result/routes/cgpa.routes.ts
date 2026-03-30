import { Router } from "express";
import { CGPAController } from "../controllers/cgpa.controller";
import { validateToken } from "../../../shared/middleware/auth.middleware";

const cgpaRouter = Router();

cgpaRouter.get('/my-cgpa', validateToken, CGPAController.getCgpa)

export default cgpaRouter