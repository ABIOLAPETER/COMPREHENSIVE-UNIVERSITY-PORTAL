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

            res.status(200).json({
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


            const publishedResult = await ResultService.publishResultByCourseService(req.params.courseId)
            res.status(200).json({
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
            res.status(200).json({
                success: true,
                message: "Published result successfully",
                data: publishedResult
            })
        } catch (error) {
            next(error)
        }

    }

    static async viewMyResults(req: Request<{}, {}, {}, { session?: string }>, res: Response, next: NextFunction) {
  try {
    const studentId = await getStudentIdFromRequest(req);

    const results = req.query.session
      ? await ResultService.viewMyResultsBySession(studentId, req.query.session)
      : await ResultService.viewMyResults(studentId);

    return res.status(200).json({
      success: true,
      message: "Results fetched successfully",
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

  
    static async viewResultForCourse(
        req: Request<{ courseId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const studentId = await getStudentIdFromRequest(req)

            const result = await ResultService.viewResultForCourse(studentId, req.params.courseId)
            res.status(200).json({
                success: true,
                message: "results fetched successfully",
                data: result
            })
        } catch (error) {
            next(error)
        }

    }
    static async getTranscript(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const studentId = await getStudentIdFromRequest(req)

            const transcript = await ResultService.getTranscript(studentId)
            res.status(200).json({
                success: true,
                message: "transcript fetched successfully",
                data: transcript
            })
        } catch (error) {
            next(error)
        }

    }


}

