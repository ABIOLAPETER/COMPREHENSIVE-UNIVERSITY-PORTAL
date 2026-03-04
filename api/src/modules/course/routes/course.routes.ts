import { Router } from "express";
import { CourseController } from "../controllers/course.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

const courseRouter = Router();

// POST /courses — department comes from body, not params
courseRouter.post("/", validateToken, adminMiddleware, CourseController.createCourse);

// GET /courses?department=:departmentId — query param filter
courseRouter.get("/", validateToken, CourseController.getCoursesByDepartment);

// PATCH /courses/:courseId — changed from PUT to PATCH (partial update, not full replace)
courseRouter.patch("/:courseId", validateToken, adminMiddleware, CourseController.updateCourse);

// GET /courses/eligible/:studentId — student fetches their own eligible courses, no adminMiddleware
courseRouter.get("/eligible/:studentId", validateToken, CourseController.getEligibleCourses);

export default courseRouter;