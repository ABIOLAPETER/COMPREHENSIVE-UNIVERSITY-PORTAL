import { Router } from "express";


import { SemesterController } from "../controllers/semester.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

const semesterRouter = Router();

semesterRouter.post("/", validateToken, adminMiddleware, SemesterController.createSemester);
semesterRouter.post("/:semesterId/activate", validateToken, adminMiddleware, SemesterController.activateSemester);


export default semesterRouter;