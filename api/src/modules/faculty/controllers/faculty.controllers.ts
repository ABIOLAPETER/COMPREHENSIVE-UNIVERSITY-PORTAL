
import { Request, Response } from "express";
import { FacultyService } from "../services/faculty.services";
import { logger } from "../../../shared/utils/logger";


export class FacultyController {
    // Implement faculty-related controller methods here

    static async createFaculty(req: Request, res: Response) {
        try {
            const { name, code } = req.body;
            const faculty = await FacultyService.createFaculty({
                name,
                code,
            });
            res.status(201).json({
                message: "Faculty created successfully",
                faculty,
            });
        } catch (err) {
            logger.error(err)
            res.status(400).json({ error: err instanceof Error ? err.message : "Create faculty failed" });
        }
    }

    static async getAllFaculties(req: Request, res: Response) {
        try {
            const faculties = await FacultyService.getAllFaculties();
            res.status(200).json({  
                message: "Faculties retrieved successfully",
                faculties,
            });
        }   
        catch (err) {
            res.status(500).json({ error: "Internal server error" });
        }   
    }

    static async getFacultyById(req: Request, res: Response) {
        try {
            const { facultyId } = req.params;
            const faculty = await FacultyService.getFacultyById(facultyId.toString());
            res.status(200).json({
                message: "Faculty retrieved successfully",
                faculty,
            });
        }
        catch (err) {
            res.status(404).json({ error: err instanceof Error ? err.message : "Faculty not found" });
        }

    }

    static async updateFaculty(req: Request, res: Response) {
        try {
            const { facultyId } = req.params;
            const { name, code } = req.body;
            const faculty = await FacultyService.updateFaculty(facultyId.toString(),
                { name, code }
            );
            res.status(200).json({
                message: "Faculty updated successfully",
                faculty,
            });
        }
        catch (err) {
            res.status(404).json({ error: err instanceof Error ? err.message : "Faculty not found" });
        }
    }

    static async deleteFaculty(req: Request, res: Response) {
        try {
            const { facultyId } = req.params;
            await FacultyService.deleteFaculty(facultyId.toString());
            res.status(200).json({
                message: "Faculty deleted successfully",
            });
        }
        catch (err) {
            res.status(404).json({ error: err instanceof Error ? err.message : "Faculty not found" });
        }
    }   

}