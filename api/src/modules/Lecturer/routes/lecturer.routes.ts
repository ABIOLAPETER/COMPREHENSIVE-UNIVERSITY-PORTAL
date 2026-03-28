// lecturer.routes.ts
import { Router } from "express";
import { LecturerController } from "../controllers/lecturer.controllers";
import { validateToken } from "../../../shared/middleware/auth.middleware";
import { adminMiddleware, lecturerMiddleware } from "../../../shared/middleware/auth.middleware";

const lecturerRouter = Router();


lecturerRouter.use(validateToken);

// ── ADMIN ONLY ────────────────────────────────────────────────────────────
lecturerRouter.post("/", adminMiddleware, LecturerController.createLecturer);
lecturerRouter.post("/:lecturerId/courses/:courseId", adminMiddleware, LecturerController.assignCourse);
lecturerRouter.delete("/:lecturerId/courses/:courseId", adminMiddleware, LecturerController.removeCourse);

// ── LECTURER ONLY ─────────────────────────────────────────────────────────
lecturerRouter.get("/my-courses", lecturerMiddleware, LecturerController.getCourses);
lecturerRouter.get("/my-students", lecturerMiddleware, LecturerController.getStudents);
lecturerRouter.get("/profile", lecturerMiddleware, LecturerController.getProfile);
lecturerRouter.patch("/profile", lecturerMiddleware, LecturerController.updateProfile);
lecturerRouter.post("/courses/:courseId/results", lecturerMiddleware, LecturerController.uploadResults);
lecturerRouter.get("/courses/:courseId/results", lecturerMiddleware, LecturerController.viewResults);

export default lecturerRouter;