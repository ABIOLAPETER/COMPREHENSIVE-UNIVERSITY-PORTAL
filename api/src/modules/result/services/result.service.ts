import { IResult, ResultModel, ResultStatus } from "../models/result.model";
import { ValidationError, NotFoundError, ConflictError, BadRequestError } from "../../../shared/errors/AppError";
import { Types } from "mongoose";

import { SemesterService } from "../../semester/services/semester.services";
import { SessionService } from "../../session/services/session.services";
import {
  generateGradeFromScore,
  generateGradePointFromGrade,
} from "../../../shared/utils/generateGradeFromScore";

import Student from "../../student/models/student.model";
import { CourseModel } from "../../course/models/course.model";
import { Grade } from "../models/result.model";

import { GPAService } from "./gpaService.service";
import { CGPAService } from "./CGPAService.service";
export class ResultService {
  static async createDraftResult(data: {
    studentId: Types.ObjectId;
    courseId: Types.ObjectId;
    score: number;
  }) {
    // Validate score
    if (data.score < 0 || data.score > 100) {
      throw new ValidationError("Score must be between 0 and 100");
    }

    const student = await Student.findById(data.studentId);
    if (!student) {
      throw new NotFoundError("Student not found");
    }

    const course = await CourseModel.findById(data.courseId);
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (!course.department.equals(student.department)) {
      throw new ValidationError("Course does not belong to student's department");
    }

    const activeSemester = await SemesterService.getActiveSemester();
    const activeSession = await SessionService.getActiveSession();

    const existingResult = await ResultModel.findOne({
      student: student._id,
      course: course._id,
      session: activeSession.name,
    });

    if (existingResult) {
      throw new ConflictError("Result already exists for this course and session");
    }

    const grade = generateGradeFromScore(data.score);
    const gradePoint = generateGradePointFromGrade(grade);
    const isPassed = grade !== Grade.F;
    const isCarryOver = grade === Grade.F;

    const result = await ResultModel.create({
      student: student._id,
      course: course._id,
      department: student.department,
      session: activeSession._id,
      semester: activeSemester._id,
      level: student.level,
      score: data.score,
      grade,
      gradePoint,
      creditUnits: course.creditUnits,
      isPassed,
      isCarryOver,
      status: ResultStatus.DRAFT,
    });

    return result;
  }


  static async publishResultByCourseService(courseId: string) {
    const results = await ResultModel.find({
      course: courseId, status: ResultStatus.DRAFT
    })
    if (results.length === 0) {
      throw new NotFoundError("Results not found for this course")
    }
    for (const r of results) {
      r.status = ResultStatus.PUBLISHED
      await r.save()

      await GPAService.calculateAndUpsertGPA(r.student);
    }

    return {
      PublishedCount: results.length
    }
  }



  static async publishResultService(resultId: string) {

    const result = await ResultModel.findById(resultId);

    if (!result) {
      throw new NotFoundError("Result does not exist");
    }

    if (result.status === ResultStatus.PUBLISHED) {
      throw new BadRequestError("Result already published");
    }
    const activeSession = await SessionService.getActiveSession();

    if (result.session !== activeSession._id) {
      throw new BadRequestError("Cannot publish result for an inactive session");
    }

    // Ensure result belongs to active semester
    const activeSemester = await SemesterService.getActiveSemester();
    if (result.semester !== activeSemester._id) {
      throw new BadRequestError("Cannot publish result for an inactive semester");
    }

    result.status = ResultStatus.PUBLISHED;
    await result.save();

    await GPAService.calculateAndUpsertGPA(result.student);

    return result;
  }


}

