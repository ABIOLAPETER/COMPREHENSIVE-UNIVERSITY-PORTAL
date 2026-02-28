import { Router } from "express";

import { validateToken,adminMiddleware } from "../../../shared/middleware/auth.middleware";

import { StudentController } from "../controllers/student.controller";

const studentRouter = Router()


studentRouter.post('/update-student/:studentId', validateToken, adminMiddleware, StudentController.updateStudent)
studentRouter.get('/user/:userId', validateToken, StudentController.getStudentProfile)

export default studentRouter;