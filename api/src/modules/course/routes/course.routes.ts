import { Router } from "express";
import { CourseController } from "../controllers/course.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";


const courseRouter = Router();

courseRouter.post('/create-course', validateToken, adminMiddleware, CourseController.createCourse)

courseRouter.put('/update-course/:courseId', validateToken, adminMiddleware, CourseController.updateCourse)

courseRouter.get('/:studentId', validateToken, adminMiddleware, CourseController.getEligibleCourses)

export default courseRouter