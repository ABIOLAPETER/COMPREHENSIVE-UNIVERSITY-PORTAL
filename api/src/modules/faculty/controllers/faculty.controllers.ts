
import { NextFunction, Request, Response } from "express";
import { FacultyService } from "../services/faculty.service";
import { CreateFacultyDto, UpdateFacultyDto } from "../dtos/faculty.dtos";


export class FacultyController {
    static async createFaculty(
        req: Request<{}, {}, CreateFacultyDto>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const faculty = await FacultyService.createFaculty(req.body);
            res.status(201).json({
                success: true,
                message: "Faculty created successfully",
                data: faculty,
            });
        } catch (err) {
            next(err)
        }
    }

    static async getAllFaculties(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const faculties = await FacultyService.getAllFaculties();
            res.status(200).json({
                success: true,
                message: "Faculties retrieved successfully",
                data: faculties,
            });
        }
        catch (err) {
            next(err)
        }
    }

    static async getFacultyById(
        req: Request<{ facultyId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { facultyId } = req.params;
            const faculty = await FacultyService.getFacultyById(facultyId);
            res.status(200).json({
                success: true,
                message: "Faculty retrieved successfully",
                data: faculty,
            });
        }
        catch (err) {
            next(err)
        }

    }

    static async updateFaculty(
        req: Request<{ facultyId: string }, {}, UpdateFacultyDto>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { facultyId } = req.params;
            const faculty = await FacultyService.updateFaculty(facultyId, req.body);
            res.status(200).json({
                success: true,
                message: "Faculty updated successfully",
                data: faculty,
            });
        }
        catch (err) {
            next(err)
        }
    }

    static async deleteFaculty(
        req: Request<{ facultyId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { facultyId } = req.params;
            await FacultyService.deleteFaculty(facultyId);
            res.status(200).json({
                success: true,
                message: "Faculty deleted successfully",
            });
        }
        catch (err) {
            next(err)
        }
    }
}