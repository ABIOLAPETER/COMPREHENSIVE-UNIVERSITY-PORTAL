import { Router } from "express";
import { CGPAController } from "../controllers/cgpa.controller";
import { validateToken } from "../../../shared/middleware/auth.middleware";

const cgpaRouter = Router();

cgpaRouter.get('/:studentId', validateToken, CGPAController.getCgpa)

export default cgpaRouter