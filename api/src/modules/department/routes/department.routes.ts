import { Router } from "express";

import {DepartmentController} from "../controllers/department.controllers";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";


const departmentRouter = Router();

departmentRouter.post("/", validateToken, adminMiddleware, DepartmentController.createDepartment);
departmentRouter.get("/", validateToken, DepartmentController.getAllDepartments);
departmentRouter.get("/:departmentId", validateToken, adminMiddleware, DepartmentController.getDepartmentById);

export default departmentRouter;