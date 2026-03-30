import { CGPAService } from "../services/CGPAService.service";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { getStudentIdFromRequest } from "../../../shared/utils/getIds";
export class CGPAController {
    static async getCgpa(
        req: Request, 
        res: Response,
        next: NextFunction
    ) {
        try {
            const studentId  = await getStudentIdFromRequest(req)

            const cgpa = await CGPAService.getStudentCgpa(studentId)

            return res.status(200).json({
                success: true,
                message: "cgpa retrieved successfully", 
                data: cgpa
            })
        } catch (error) {
            next(error)
        }

    }
}