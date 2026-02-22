import { Router } from "express";

import { RegistrationController } from "../controllers/registration.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";


const registrationRouter = Router();


registrationRouter.post('/:studentId', validateToken,RegistrationController.createDraftReg)

registrationRouter.post("/:registrationid/:courseid", validateToken, RegistrationController.addCourseToReg)

registrationRouter.post("/:registrationId", validateToken, RegistrationController.submitReg)

export default registrationRouter
