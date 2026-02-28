

import { GPAService } from "../services/gpaService.service";
import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
export class GPAController {
    static async getGpa(req: Request, res: Response) {
        try {
            const { studentId } = req.params

            const gpa = await GPAService.getstudentGpa(studentId.toString())

            return res.status(200).json({
                message: "gpa retrieved successfully", gpa
            })
        } catch (error) {
            res.status(400).json(
                { error: error instanceof AppError ? error.message : "get gpa failed" }
            );
        }

    }
}