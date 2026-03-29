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
// GET /results/my-results — all published results for student
static async viewMyResults(studentId: string): Promise<IResult[]> {
  const student = await Student.findById(studentId);
  if (!student) throw new NotFoundError("Student not found");

  const results = await ResultModel.find({
    student:    student._id,
    status:     ResultStatus.PUBLISHED,
  })
    .populate("course", "code title creditUnits type")
    .populate("semester", "name")
    .populate("session", "name")
    .sort({ createdAt: -1 });

  return results;
}

// GET /results/my-results?session=sessionId — filter by session
static async viewMyResultsBySession(
  studentId: string,
  sessionId: string
): Promise<IResult[]> {
  const student = await Student.findById(studentId);
  if (!student) throw new NotFoundError("Student not found");

  const results = await ResultModel.find({
    student: student._id,
    session: sessionId,
    status:  ResultStatus.PUBLISHED,
  })
    .populate("course", "code title creditUnits type")
    .populate("semester", "name")
    .sort({ createdAt: -1 });

  return results;
}

// GET /results/my-results/:courseId — single course result
static async viewResultForCourse(
  studentId: string,
  courseId: string
): Promise<IResult> {
  const student = await Student.findById(studentId);
  if (!student) throw new NotFoundError("Student not found");

  const activeSemester = await SemesterService.getActiveSemester();
  const activeSession  = await SessionService.getActiveSession();

  const result = await ResultModel.findOne({
    student:  student._id,
    course:   courseId,
    semester: activeSemester._id,
    session:  activeSession._id,
    status:   ResultStatus.PUBLISHED,
  }).populate("course", "code title creditUnits type");

  if (!result) throw new NotFoundError("Result not found");

  return result;
}

// GET /results/transcript — full academic record grouped by session
static async getTranscript(studentId: string) {
  const student = await Student.findById(studentId)
    .populate("department", "name")
    .populate("faculty", "name");

  if (!student) throw new NotFoundError("Student not found");

  const results = await ResultModel.find({
    student: student._id,
    status:  ResultStatus.PUBLISHED,
  })
    .populate("course", "code title creditUnits type")
    .populate("session", "name")
    .populate("semester", "name")
    .sort({ createdAt: 1 });

  // Group by session → semester
  const transcript: Record<string, any> = {};

  for (const result of results) {
    const sessionName  = (result.session as any)?.name || "Unknown";
    const semesterName = (result.semester as any)?.name || "Unknown";

    if (!transcript[sessionName]) {
      transcript[sessionName] = {};
    }

    if (!transcript[sessionName][semesterName]) {
      transcript[sessionName][semesterName] = {
        results:      [],
        totalCredits: 0,
        totalPoints:  0,
        gpa:          0,
      };
    }

    transcript[sessionName][semesterName].results.push(result);
    transcript[sessionName][semesterName].totalCredits += result.creditUnits;
    transcript[sessionName][semesterName].totalPoints  += result.gradePoint * result.creditUnits;
  }

  // Calculate GPA per semester
  for (const session of Object.values(transcript)) {
    for (const semester of Object.values(session as any)) {
      const s = semester as any;
      s.gpa = s.totalCredits > 0
        ? parseFloat((s.totalPoints / s.totalCredits).toFixed(2))
        : 0;
    }
  }

  return {
    student: {
      name:         `${student.firstName} ${student.lastName}`,
      matricNumber: student.matricNumber,
      department:   (student.department as any)?.name,
      level:        student.level,
    },
    transcript,
  };
}
// ```

// ---

// **Routes to add:**
// ```
// GET /results/my-results              → viewMyResults
// GET /results/my-results?session=id   → viewMyResultsBySession
// GET /results/my-results/:courseId    → viewResultForCourse
// GET /results/transcript              → getTranscript
// // GET /results/my-results?session=2024/2025 — filter by session


}