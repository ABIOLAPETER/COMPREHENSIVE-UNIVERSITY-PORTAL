import { CGPAService } from "../services/CGPAService.service";
import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
export class CGPAController {
    static async getCgpa(req: Request, res: Response) {
        try {
            const { studentId } = req.params

            const cgpa = await CGPAService.getstudentCgpa(studentId.toString())

            return res.status(200).json({
                message: "cgpa retrieved successfully", cgpa
            })
        } catch (error) {
            res.status(400).json(
                { error: error instanceof AppError ? error.message : "get cgpa failed" }
            );
        }

    }
}