import { Router } from "express";
import { RegistrationController } from "../controllers/registration.controller";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";

const registrationRouter = Router();

// ✅ Add this




registrationRouter.post("/draft",   validateToken, RegistrationController.createDraftReg);
registrationRouter.get("/current",  validateToken, RegistrationController.getDraftReg);

registrationRouter.get("/",         validateToken, adminMiddleware, RegistrationController.getAllRegistrations);

registrationRouter.post("/:registrationId/courses",          validateToken, RegistrationController.addCourseToReg);
registrationRouter.delete("/:registrationId/courses/:courseId", validateToken, RegistrationController.removeCourseFromReg);
registrationRouter.patch("/:registrationId/submit",          validateToken, RegistrationController.submitReg);
registrationRouter.patch("/:registrationId/approve",         validateToken, adminMiddleware, RegistrationController.approveRegistration);
registrationRouter.patch("/:registrationId/reject",          validateToken, adminMiddleware, RegistrationController.rejectRegistration);

export default registrationRouter;