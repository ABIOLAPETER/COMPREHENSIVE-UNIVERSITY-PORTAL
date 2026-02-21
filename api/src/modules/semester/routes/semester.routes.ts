import { Router } from "express";


import { SemesterController } from "../controllers/semester.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

const router = Router();

router.post("/", validateToken, adminMiddleware, SemesterController.createSemester);
router.post("/:semesterId/activate", validateToken, adminMiddleware, SemesterController.activateSemester);
export default router;