import { Router } from "express";
import { SemesterController } from "../controllers/semester.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

const semesterRouter = Router();

// POST /semesters
semesterRouter.post("/", validateToken, adminMiddleware, SemesterController.createSemester);

// GET /semesters/active — must be BEFORE /:semesterId or "active" gets treated as a param
semesterRouter.get("/active", validateToken, SemesterController.getActiveSemester);

// PATCH /semesters/:semesterId/activate — changed from POST, it's a state change not a creation
semesterRouter.patch("/:semesterId/activate", validateToken, adminMiddleware, SemesterController.activateSemester);

// PATCH /semesters/lock — no semesterId needed, always locks the active semester
semesterRouter.patch("/lock", validateToken, adminMiddleware, SemesterController.lockSemester);

export default semesterRouter;