import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { CounterService } from "./counter.service";
import { BadRequestError, NotFoundError, ValidationError, ConflictError } from "../../../shared/errors/AppError";
import { generateStaffId } from "../../../shared/utils/generateMatricNumber";
import { DepartmentModel } from "../../department/models/department.model";
import { FacultyModel } from "../../faculty/models/faculty.model";
import { createLecturerDto, updateLecturerDto } from "../dtos/lecturer.dtos";
import Lecturer, { ILecturer } from "../models/lecturer.models";
import { Role, UserModel } from "../../identity/models/identity.models";
import { SemesterService } from "../../semester/services/semester.services";
import { RegistrationModel, RegistrationStatus } from "../../registration/models/registration.model";
import { ResultModel } from "../../result/models/result.model";
import { CourseModel } from "../../course/models/course.model";
import { redisClient } from "../../../shared/utils/redis";
import { Grade } from "../../result/models/result.model";
import { AnyBulkWriteOperation } from "mongoose";
import { ResultStatus } from "../../result/models/result.model";
export class LecturerService {

  private static readonly SALT_ROUNDS = 12;

  // ── CREATE LECTURER (Admin only) ──────────────────────────────────────────
  static async createLecturer(data: createLecturerDto): Promise<{
    id: unknown;
    email: string;
    staffId: string;
    name: string;
  }> {
    const { email, firstName, lastName, departmentId } = data;

    if (!email || !firstName || !lastName || !departmentId) {
      throw new ValidationError("Missing required fields");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanFirstName  = firstName.trim();
    const cleanLastName   = lastName.trim();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingUser = await UserModel
        .findOne({ email: normalizedEmail })
        .session(session);
      if (existingUser) throw new ConflictError("Email already in use");

      const existingLecturer = await Lecturer
        .findOne({ email: normalizedEmail })
        .session(session);
      if (existingLecturer) throw new ConflictError("Lecturer already exists");

      const department = await DepartmentModel
        .findById(departmentId)
        .select("code faculty")
        .session(session);
      if (!department) throw new NotFoundError("Department not found");

      const faculty = await FacultyModel
        .findById(department.faculty)
        .select("code")
        .session(session);
      if (!faculty) throw new NotFoundError("Faculty not found");

      const sequence = await CounterService.generateSequence(
        new Date().getFullYear(),
        session
      );

      const staffId = generateStaffId(
        faculty.code,
        department.code,
        new Date().getFullYear(),
        sequence
      );

      const defaultPassword = "ChangeMe123!";
      const passwordHash    = await bcrypt.hash(defaultPassword, this.SALT_ROUNDS);

      const [user] = await UserModel.create([{
        email:           normalizedEmail,
        lastName:        cleanLastName,
        firstName:       cleanFirstName,
        passwordHash,
        isEmailVerified: false,
        role:            Role.LECTURER,
      }], { session });

      const [lecturer] = await Lecturer.create([{
        email:      normalizedEmail,
        department: departmentId,
        firstName:  cleanFirstName,
        lastName:   cleanLastName,
        staffId,
        user:       user._id,
        isActive:   true,
      }], { session });

      await session.commitTransaction();

      // Invalidate lecturer list cache
      await redisClient.del("lecturers:all");

      return {
        id:     lecturer._id,
        email:  lecturer.email,
        staffId: lecturer.staffId,
        name:   `${lecturer.firstName} ${lecturer.lastName}`,
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ── ASSIGN COURSE TO LECTURER (Admin only) ────────────────────────────────
  static async assignCourse(lecturerId: string, courseId: string): Promise<ILecturer> {
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) throw new NotFoundError("Lecturer not found");

    const course = await CourseModel.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");
    
    const alreadyAssigned = lecturer.courses.some(
      c => c.toString() === courseId
    );
    if (alreadyAssigned) throw new ConflictError("Course already assigned to this lecturer");

    lecturer.courses.push(course._id);
    await lecturer.save();

    // Invalidate cache
    await redisClient.del(`lecturer:courses:${lecturerId}`);

    return lecturer;
  }

  static async removeCourse(lecturerId: string, courseId: string): Promise<ILecturer> {
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) throw new NotFoundError("Lecturer not found");
 if (!lecturer.courses || lecturer.courses.length === 0) {
    throw new BadRequestError("Lecturer as no courses to remove  from")
  }
    const courseExists = lecturer.courses.some(
      c => c.toString() === courseId
    );
    if (!courseExists) throw new NotFoundError("Course not assigned to this lecturer");

    lecturer.courses = lecturer.courses.filter(
      c => c.toString() !== courseId
    );
    await lecturer.save();

    // Invalidate cache
    await redisClient.del(`lecturer:courses:${lecturerId}`);

    return lecturer;
  }

  static async viewAssignedCourses(lecturerId: string) {
    const cacheKey = `lecturer:courses:${lecturerId}`;
    const cached   = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const lecturer = await Lecturer.findById(lecturerId)
      .populate({
        path:   "courses",
        select: "code title creditUnits semester level type",
      })
      .select("courses");

    if (!lecturer) throw new NotFoundError("Lecturer not found");

    const courses = lecturer.courses || [];
    await redisClient.setex(cacheKey, 3600, JSON.stringify(courses));
    return courses;
  }

  
  static async getRegisteredStudentsForMyCourses(lecturerId: string) {
    const lecturer = await Lecturer.findById(lecturerId)
      .select("courses department");

    if (!lecturer) throw new NotFoundError("Lecturer not found");

    if (!lecturer.courses || lecturer.courses.length === 0) {
      return [];
    }

    const currentSemester = await SemesterService.getActiveSemester();

    const approvedRegistrations = await RegistrationModel.find({
      semester:   currentSemester.name,
      status:     RegistrationStatus.APPROVED,
      department: lecturer.department,
    })
      .populate("student", "firstName lastName matricNumber level")
      .populate("courses.course", "code title creditUnits semester");

    const myCourseIds = lecturer.courses.map(c => c.toString());

    const result: any[] = [];

    for (const registration of approvedRegistrations) {
      
      const matchedCourses = registration.courses.filter((c: any) =>
        myCourseIds.includes(c.course?._id?.toString())
      );

      if (matchedCourses.length > 0) {
        result.push({
          student: registration.student,
          courses: matchedCourses.map((c: any) => c.course),
        });
      }
    }

    return result;
  }

 
static async uploadStudentResultForMyCourse(
  lecturerId: string,
  courseId: string,
  results: { studentId: string; score: number }[]
) {
  const lecturer = await Lecturer.findById(lecturerId);
  if (!lecturer) throw new NotFoundError("Lecturer not found");

  if (!lecturer.courses || lecturer.courses.length === 0) {
    throw new BadRequestError("Lecturer has no courses ")
  } 

  const isAssigned = lecturer.courses.some(c => c.toString() === courseId);
  if (!isAssigned) {
    throw new BadRequestError("You are not assigned to this course");
  }

  // Fetch course to get creditUnits and department
  const course = await CourseModel.findById(courseId);
  if (!course) throw new NotFoundError("Course not found");

  const currentSemester = await SemesterService.getActiveSemester();

  const gradePointMap: Record<Grade, number> = {
    [Grade.A]: 5,
    [Grade.B]: 4,
    [Grade.C]: 3,
    [Grade.D]: 2,
    [Grade.E]: 1,
    [Grade.F]: 0,
  };

  const bulkOps: AnyBulkWriteOperation<any>[] = results.map(({ studentId, score }) => {
    if (score < 0 || score > 100) {
      throw new BadRequestError(`Invalid score ${score} for student ${studentId}`);
    }

    const grade      = this.calculateGrade(score);
    const gradePoint = gradePointMap[grade as Grade];
    const isPassed   = grade !== Grade.F;

    return {
      updateOne: {
        filter: {
          student:  studentId,
          course:   courseId,
          semester: currentSemester._id,
        },
        update: {
          $set: {
            score,
            grade,
            gradePoint,
            isPassed,
            creditUnits: course.creditUnits,
            department:  course.department,
            status:      ResultStatus.DRAFT,
          },
        },
        upsert: false,
      },
    };
  });

  const bulkResult = await ResultModel.bulkWrite(bulkOps);

  return {
    matched:  bulkResult.matchedCount,
    modified: bulkResult.modifiedCount,
    message:  `${bulkResult.modifiedCount} result(s) uploaded successfully`,
  };
}

  
  static async viewResultsForCourse(lecturerId: string, courseId: string) {
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) throw new NotFoundError("Lecturer not found");

    if (!lecturer.courses || lecturer.courses.length === 0) {
    throw new BadRequestError("Lecturer has no courses ")
  }
    const isAssigned = lecturer.courses.some(c => c.toString() === courseId);
    if (!isAssigned) {
      throw new BadRequestError("You are not assigned to this course");
    }

    const currentSemester = await SemesterService.getActiveSemester();

    const results = await ResultModel.find({
      course:   courseId,
      semester: currentSemester._id,
    })
      .populate("student", "firstName lastName matricNumber level")
      .sort({ "student.lastName": 1 });

    return results;
  }


  static async viewProfile(lecturerId: string): Promise<ILecturer> {
    const cacheKey = `lecturer:profile:${lecturerId}`;
    const cached   = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const lecturer = await Lecturer.findById(lecturerId)
      .populate("department", "name code")
      .populate({
        path:   "courses",
        select: "code title creditUnits semester",
      })
      .select("firstName lastName email staffId department courses isActive");

    if (!lecturer) throw new NotFoundError("Lecturer not found");

    await redisClient.setex(cacheKey, 3600, JSON.stringify(lecturer));
    return lecturer;
  }

  static async updateProfile(
    data: Partial<updateLecturerDto>,
    lecturerId: string
  ): Promise<Partial<ILecturer>> {
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) throw new NotFoundError("Lecturer not found");

    if (data.firstName) lecturer.firstName = data.firstName.trim();
    if (data.lastName)  lecturer.lastName  = data.lastName.trim();

    await lecturer.save();

    await redisClient.del(`lecturer:profile:${lecturerId}`);

    return {
      firstName: lecturer.firstName,
      lastName:  lecturer.lastName,
      email:     lecturer.email,
      staffId:   lecturer.staffId,
    };
  }

  private static calculateGrade(score: number):Grade {
    if (score >= 70) return Grade.A;
    if (score >= 60) return Grade.B;
    if (score >= 50) return Grade.C;
    if (score >= 45) return Grade.D;
    if (score >= 40) return Grade.E;
    return Grade.F;
  }
}