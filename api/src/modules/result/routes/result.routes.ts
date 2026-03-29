import { Router } from "express";
import { ResultController } from "../controllers/result.controller";
import { validateToken } from "../../../shared/middleware/auth.middleware";
import { adminMiddleware } from "../../../shared/middleware/auth.middleware";

const resultRouter = Router();

resultRouter.use(validateToken);

// Admin routes
resultRouter.post("/create", adminMiddleware, ResultController.createResult);
resultRouter.patch("/publish/result/:resultId", adminMiddleware, ResultController.publishResult);
resultRouter.patch("/publish/course/:courseId", adminMiddleware, ResultController.publishResultByCourse);
resultRouter.patch("/publish/semester/:semesterId", adminMiddleware, ResultController.publishResultBySemester);

// Student routes
resultRouter.get("/my-results", ResultController.viewMyResults);
resultRouter.get("/my-results/:courseId", ResultController.viewResultForCourse);
resultRouter.get("/transcript", ResultController.getTranscript);

export default resultRouter;