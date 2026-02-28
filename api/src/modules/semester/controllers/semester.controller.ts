
import { SemesterService } from "../services/semester.services";
import { Request, Response } from "express";
import { logger } from "../../../shared/utils/logger";
import { AppError } from "../../../shared/errors/AppError";


export class SemesterController {
    // Implement semester-related controller methods here

    static async createSemester(req: Request, res: Response) {
        try {
            logger.info("Creating semester with data: ", req.body);
            const { name, sessionId } = req.body;
            const semester = await SemesterService.createSemester({
                name,
                sessionId
            });
            res.status(201).json({
                message: "Semester created successfully",
                semester,
            });
        } catch (err) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json({ error: err.message });
            }

            return res.status(500).json({ error: "Internal server error" });
        }

    }

    static async activateSemester(req: Request, res: Response) {
        try {
            logger.info(`Activating semester with ID: ${req.params.semesterId}`);
            const { semesterId } = req.params;
            const semester = await SemesterService.activateSemester(semesterId.toString());
            res.status(200).json({
                message: "Semester activated successfully",
                semester,
            });
        } catch (err) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json({ error: err.message });
            }
            return res.status(500).json({ error: "Activate semester failed" });
        }
    }

    static async lockSemester(req: Request, res:Response){
        try {
            res.status(200).json({
                message: "Semester Locked successfully"
            })
        } catch (err) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json({ error: err.message });
            }
            return res.status(500).json({ error: "lock semester failed" });
        }
    }

}