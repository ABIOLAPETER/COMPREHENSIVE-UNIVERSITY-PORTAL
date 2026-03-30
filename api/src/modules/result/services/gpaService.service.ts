import { Types } from "mongoose";
import { ResultModel, ResultStatus } from "../models/result.model";
import { IStudentGPA, StudentGPAModel } from "../models/GPA.model";
import { SemesterService } from "../../semester/services/semester.services";
import { SessionService } from "../../session/services/session.services";
import { NotFoundError } from "../../../shared/errors/AppError";
import { CGPAService } from "./CGPAService.service";
import { logger } from "../../../shared/utils/logger";
import { BadRequestError } from "../../../shared/errors/AppError";
export class GPAService {
  static async calculateAndUpsertGPA(studentId: string) {

    const semester = await SemesterService.getActiveSemester();
    if (!semester) {
      throw new NotFoundError("No active semester");
    }

    const session = await SessionService.getActiveSession();
    if (!session) {
      throw new NotFoundError("No active session");
    }

    const results = await ResultModel.find({
      student: studentId,
      semester: semester._id,
      session: session._id,
      status: ResultStatus.PUBLISHED,
    });

    if (results.length === 0) {
      return null; // no GPA yet
    }

    let totalCredits = 0;
    let totalGradePoints = 0;

    for (const result of results) {
      totalCredits += result.creditUnits;
      totalGradePoints += result.gradePoint * result.creditUnits;
    }

    const gpa =
      totalCredits === 0
        ? 0
        : Number((totalGradePoints / totalCredits).toFixed(2));

    const gpaDetails = await StudentGPAModel.findOneAndUpdate(
      {
        student: studentId,
        session: session._id,
        semester: semester._id,
      },
      {
        student: studentId,
        session: session._id,
        semester: semester._id,
        totalCredits,
        totalGradePoints,
        gpa,
        level: results[0].level,
      },
      {
        upsert: true,
        new: true,
      }
    );


    try {
      await CGPAService.calculateAndUpsertCGPA(studentId)
    } catch (error) {
      logger.error("CGPA auto-update failed", error)
    }

    return gpaDetails;

  }


  static async getStudentGpa(
    studentId: string,
    semesterId?: string,
    sessionId?: string
  ): Promise<IStudentGPA> {

    // If no semesterId/sessionId provided, default to active semester and session
    const semester = semesterId || (await SemesterService.getActiveSemester())._id;
    const session = sessionId || (await SessionService.getActiveSession())._id;

    const GPADetails = await StudentGPAModel.findOne({
      student: studentId,
      semester: semester,
      session: session,
    })
      .populate("semester", "name")
      .populate("session", "name");

    if (!GPADetails) {
      throw new NotFoundError("GPA details not found");
    }

    return GPADetails;
  }
}