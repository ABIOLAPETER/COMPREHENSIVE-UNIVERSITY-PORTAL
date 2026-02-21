import { Router } from "express";

import { FacultyController } from "../controllers/faculty.controllers";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";


const router = Router();

router.post("/", validateToken, adminMiddleware, FacultyController.createFaculty);
router.get("/", validateToken, FacultyController.getAllFaculties);
router.get("/:facultyId", validateToken, FacultyController.getFacultyById);
router.put("/:facultyId", validateToken, adminMiddleware, FacultyController.updateFaculty);
router.delete("/:facultyId", validateToken, adminMiddleware, FacultyController.deleteFaculty);

