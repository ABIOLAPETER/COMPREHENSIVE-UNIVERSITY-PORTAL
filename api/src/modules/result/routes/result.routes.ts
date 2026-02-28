import { Router } from "express";
import { ResultController } from "../controllers/result.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

const resultRouter = Router();

resultRouter.post('/create-result', validateToken, adminMiddleware, ResultController.createResult)

resultRouter.post('/publish/:courseId', validateToken, adminMiddleware, ResultController.publishResultByCourse)

resultRouter.post('/publish/:resultId', validateToken, adminMiddleware, ResultController.publishResult)

export default resultRouter