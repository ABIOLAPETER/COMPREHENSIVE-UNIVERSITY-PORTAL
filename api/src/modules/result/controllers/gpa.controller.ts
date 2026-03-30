

import { GPAService } from "../services/gpaService.service";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { getStudentIdFromRequest } from "../../../shared/utils/getIds";
export class GPAController {
    static async getGpa(
  req: Request<{}, {}, {}, { semesterId: string; sessionId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const studentId  = await getStudentIdFromRequest(req);
    const { semesterId, sessionId } = req.query;

    if (!semesterId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "semesterId and sessionId are required",
      });
    }

    const gpa = await GPAService.getStudentGpa(studentId, semesterId, sessionId);

    return res.status(200).json({
      success: true,
      message: "GPA fetched successfully",
      data: gpa,
    });
  } catch (error) {
    next(error);
  }
}
}