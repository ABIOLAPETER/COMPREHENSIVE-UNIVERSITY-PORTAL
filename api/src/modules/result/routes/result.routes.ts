import { Router } from "express";
import { ResultController } from "../controllers/result.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";


const resultRouter = Router();

resultRouter.post('/create-result', validateToken, ResultController.createResult)

resultRouter.post('/:resultId', validateToken, ResultController.publishResult)

export default resultRouter