import { Router } from "express";

import { FacultyController } from "../controllers/faculty.controllers";
import { validateToken, adminMiddleware } from "../../../shared/middleware/auth.middleware";


const facultyRouter = Router();

facultyRouter.post("/", validateToken, adminMiddleware, FacultyController.createFaculty);
facultyRouter.get("/", validateToken, FacultyController.getAllFaculties);
facultyRouter.get("/:facultyId", validateToken, FacultyController.getFacultyById);
facultyRouter.put("/:facultyId", validateToken, adminMiddleware, FacultyController.updateFaculty);
facultyRouter.delete("/:facultyId", validateToken, adminMiddleware, FacultyController.deleteFaculty);

export default facultyRouter