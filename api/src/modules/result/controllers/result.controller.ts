import { Request, Response } from "express";
import { ResultService } from "../services/result.service";

export class ResultController{

static async createResult(req: Request, res: Response){
    try {
        const {studentId, courseId, score} = req.body

        const createDraftResult = await ResultService.createDraftResult({studentId, courseId, score})

        res.status(201).json({
            message: "Draft result created successfully", createDraftResult
        })
    } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Create draft result failed" });
    }
    

    

}

static async publishResult(req: Request, res: Response){
    try {
        const {resultId} = req.params

        const publishResult = await ResultService.publishResultService(resultId.toString())

        res.status(201).json({
            message: "Published result  successfully", publishResult
        })
    } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : "could not PUBLISH RESULT" });
    }

}


static async publishResultByCourse(req: Request, res: Response){
    try {
        const {courseId} = req.params

        const publishedResult = await ResultService.publishResultService(courseId.toString())

        res.status(201).json({
            message: "Published result successfully", publishedResult
        })
    } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : "could not PUBLISH RESULT" });
    }

}
}

