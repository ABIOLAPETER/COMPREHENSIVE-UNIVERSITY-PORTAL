import { Router } from "express";
import { CourseController } from "../controllers/course.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

const courseRouter = Router();

courseRouter.post("/", validateToken, adminMiddleware, CourseController.createCourse);
courseRouter.get("/", validateToken, CourseController.getCoursesByDepartment);
courseRouter.patch("/:courseId", validateToken, adminMiddleware, CourseController.updateCourse);
courseRouter.get("/eligible/:studentId", validateToken, CourseController.getEligibleCourses);

export default courseRouter;