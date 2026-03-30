import { Router } from "express";
import { AdminController } from "./admin.controller";
import { adminMiddleware, validateToken } from "../../shared/middleware/auth.middleware";

const adminRouter = Router()

adminRouter.get('/stats', validateToken, adminMiddleware, AdminController.getDashboardStats)
adminRouter.get('/students', validateToken, adminMiddleware, AdminController.getAllStudents)
adminRouter.get('/courses', validateToken, adminMiddleware, AdminController.getAllCourses)
adminRouter.get('/lecturers', validateToken, adminMiddleware, AdminController.getAllLecturers)
adminRouter.get('/reset-password/:userId', validateToken, adminMiddleware, AdminController.resetUserPassword)

export default adminRouter