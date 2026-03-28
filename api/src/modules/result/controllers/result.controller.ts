import { NextFunction, Request, Response } from "express";
import { ResultService } from "../services/result.service";
import { createDraftResultDto } from "../dtos/result.dtos";
import { getStudentIdFromRequest } from "../../../shared/utils/getIds";

export class ResultController {

    static async createResult(
        req: Request<{}, {}, createDraftResultDto>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const studentId = await getStudentIdFromRequest(req)
            const createDraftResult = await ResultService.createDraftResult(req.body, studentId)

            res.status(201).json({
                success: true,
                message: "Draft result created successfully",
                data: createDraftResult
            })
        } catch (error) {
            next(error)
        }


    }

    static async publishResult(
        req: Request<{ resultId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const publishResult = await ResultService.publishResultService(req.params.resultId)

            res.status(201).json({
                success: true,
                message: "Published result  successfully",
                data: publishResult
            })
        } catch (error) {
            next(error)
        }
    }


    static async publishResultByCourse(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {


            const publishedResult = await ResultService.publishResultService(req.params.courseId)
            res.status(201).json({
                success: true,
                message: "Published result successfully",
                data: publishedResult
            })
        } catch (error) {
            next(error)
        }

    }
    static async publishResultBySemester(
        req: Request<{ semesterId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {


            const publishedResult = await ResultService.bulkPublishResultForSemesterService(req.params.semesterId)
            res.status(201).json({
                success: true,
                message: "Published result successfully",
                data: publishedResult
            })
        } catch (error) {
            next(error)
        }

    }


}

