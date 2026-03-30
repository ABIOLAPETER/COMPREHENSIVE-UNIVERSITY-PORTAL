import { Router } from "express";

import { validateToken,adminMiddleware } from "../../../shared/middleware/auth.middleware";

import { StudentController } from "../controllers/student.controller";

const studentRouter = Router()

studentRouter.get('/registrations/my-registrations', validateToken, StudentController.getAllApprovedRegistrations)
studentRouter.get('/user/:userId', validateToken, StudentController.getStudentProfile)

export default studentRouter;