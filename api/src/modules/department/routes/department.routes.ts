import { Router } from "express";

import {DepartmentController} from "../controllers/department.controllers";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";


const router = Router();

router.post("/", validateToken, adminMiddleware, DepartmentController.createDepartment);
router.get("/", validateToken, DepartmentController.getAllDepartments);
router.get("/:departmentId", validateToken, DepartmentController.getDepartmentById);

export default router;