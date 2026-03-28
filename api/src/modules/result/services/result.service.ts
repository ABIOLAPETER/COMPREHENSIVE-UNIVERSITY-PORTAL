import { IResult, ResultModel, ResultStatus } from "../models/result.model";
import { ValidationError, NotFoundError, ConflictError, BadRequestError } from "../../../shared/errors/AppError";
import { Types } from "mongoose";
import { SemesterService } from "../../semester/services/semester.services";
import { SessionService } from "../../session/services/session.services";
import { generateGradeFromScore, generateGradePointFromGrade } from "../../../shared/utils/generateGradeFromScore";
import Student from "../../student/models/student.model";
import { CourseModel } from "../../course/models/course.model";
import { Grade } from "../models/result.model";
import { GPAService } from "./gpaService.service";
import { createDraftResultDto } from "../dtos/result.dtos";

export class ResultService {

  static async createDraftResult(data: createDraftResultDto, studentId: string): Promise<IResult> {
    if (data.score < 0 || data.score > 100) {
      throw new ValidationError("Score must be between 0 and 100");
    }

    const student = await Student.findById(studentId);
    if (!student) throw new NotFoundError("Student not found");

    const course = await CourseModel.findById(data.courseId);
    if (!course) throw new NotFoundError("Course not found");

    if (!course.department.equals(student.department)) {
      throw new ValidationError("Course does not belong to student's department");
    }

    const activeSemester = await SemesterService.getActiveSemester();
    const activeSession  = await SessionService.getActiveSession();

    const existingResult = await ResultModel.findOne({
      student: student._id,
      course:  course._id,
      session: activeSession._id,
    });

    if (existingResult) {
      throw new ConflictError("Result already exists for this course and session");
    }

    const grade      = generateGradeFromScore(data.score);
    const gradePoint = generateGradePointFromGrade(grade);
    const isPassed   = grade !== Grade.F;
    const isCarryOver = grade === Grade.F;

    const result = await ResultModel.create({
      student:     student._id,
      course:      course._id,
      department:  student.department,
      session:     activeSession._id,
      semester:    activeSemester._id,
      level:       student.level,
      score:       data.score,
      grade,
      gradePoint,
      creditUnits: course.creditUnits,
      isPassed,
      isCarryOver,
      status:      ResultStatus.DRAFT,
    });

    return result;
  }

  static async publishResultByCourseService(courseId: string): Promise<{ publishedCount: number }> {
    const course = await CourseModel.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");

    const results = await ResultModel.find({
      course: courseId,
      status: ResultStatus.DRAFT,
    });

    if (results.length === 0) {
      throw new NotFoundError("No draft results found for this course");
    }

    // Bulk update — one DB call instead of N
    await ResultModel.updateMany(
      { course: courseId, status: ResultStatus.DRAFT },
      { $set: { status: ResultStatus.PUBLISHED } }
    );

    // Calculate GPA for unique students only
    const uniqueStudentIds = [...new Set(results.map(r => r.student.toString()))];
    await Promise.all(
      uniqueStudentIds.map(studentId => GPAService.calculateAndUpsertGPA(studentId))
    );

    return { publishedCount: results.length };
  }

  static async publishResultService(resultId: string): Promise<IResult> {
    const result = await ResultModel.findById(resultId);
    if (!result) throw new NotFoundError("Result not found");

    if (result.status === ResultStatus.PUBLISHED) {
      throw new BadRequestError("Result already published");
    }

    const activeSession  = await SessionService.getActiveSession();
    const activeSemester = await SemesterService.getActiveSemester();

    // FIX: use .equals() for ObjectId comparison
    if (!result.session.equals(activeSession._id)) {
      throw new BadRequestError("Cannot publish result for an inactive session");
    }

    if (!result.semester.equals(activeSemester._id)) {
      throw new BadRequestError("Cannot publish result for an inactive semester");
    }

    result.status = ResultStatus.PUBLISHED;
    await result.save();

    await GPAService.calculateAndUpsertGPA(result.student.toString());

    return result;
  }

  static async bulkPublishResultForSemesterService(semesterId: string): Promise<{ publishedCount: number }> {
    const results = await ResultModel.find({
      semester: semesterId,
      status:   ResultStatus.DRAFT,
    });

    if (results.length === 0) {
      throw new NotFoundError("No draft results found for this semester");
    }

    const activeSession  = await SessionService.getActiveSession();
    const activeSemester = await SemesterService.getActiveSemester(); 

    // Validate all results belong to active session and semester
    for (const r of results) {
      if (!r.session.equals(activeSession._id)) {
        throw new BadRequestError("Cannot publish result for an inactive session");
      }
      if (!r.semester.equals(activeSemester._id)) {
        throw new BadRequestError("Cannot publish result for an inactive semester");
      }
    }

    // Bulk update — one DB call
    await ResultModel.updateMany(
      { semester: semesterId, status: ResultStatus.DRAFT },
      { $set: { status: ResultStatus.PUBLISHED } }
    );

    // Calculate GPA for unique students only
    // creaates a new array of studentId's converted to string
    const uniqueStudentIds = [...new Set(results.map(r => r.student.toString()))];
   
    await Promise.all(
      uniqueStudentIds.map(studentId => GPAService.calculateAndUpsertGPA(studentId))
    );

    return { publishedCount: results.length };
  }
}