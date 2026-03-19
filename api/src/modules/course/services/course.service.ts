import mongoose from "mongoose";
import { CourseModel, ICourse, CourseType } from "../models/course.model";
import { DepartmentModel } from "../../department/models/department.model";
import Student from "../../student/models/student.model";
import { SemesterService } from "../../semester/services/semester.services";
import { validateCourseCreation } from "../../../shared/utils/validate";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError";
import { getLevelAndSemester } from "../../../shared/utils/getLevelAndsemesterFromCode";
import { redisClient } from "../../../shared/utils/redis";
import { CreateCourseDto, UpdateCourseDto } from "../dtos/course.dtos";

export class CourseService {

  static async createCourse(data: CreateCourseDto): Promise<ICourse> {
    const { level, semester } = getLevelAndSemester(data.code);
    const courseData = { ...data, level, semester };
    const validatedData = validateCourseCreation(courseData);

    if (!validatedData) {
      throw new Error("Invalid course data");
    }

    const existing = await CourseModel.findOne({
      department: validatedData.department,
      code: validatedData.code,
    });

    if (existing) {
      throw new ConflictError("Course code must be unique within the department");
    }

    const course = new CourseModel(validatedData);
    await course.save();
    await redisClient.del(`courses:${validatedData.department}`);
    return course;
  }

  static async getCoursesByDepartment(departmentId: string): Promise<ICourse[]> {
    const cacheKey = `courses:${departmentId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const department = await DepartmentModel.findById(departmentId);
    if (!department) throw new NotFoundError("Department not found");

    const courses = await CourseModel.find({ department: departmentId })
      .populate("department", "name code")
      .sort({ title: 1 });

    await redisClient.setex(cacheKey, 21600, JSON.stringify(courses));
    return courses;
  }

  static async updateCourse(courseId: string, data: UpdateCourseDto): Promise<ICourse> {
    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!course) throw new NotFoundError("Course not found");


    await redisClient.del(`courses:${course.department}`);

    // Safe eligible cache invalidation
    const keys = await redisClient.keys(`courses:eligible:*`);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }

    return course;
  }

  static async listEligibleCoursesForStudent(studentId: string): Promise<ICourse[]> {
    const activeSemester = await SemesterService.getActiveSemester();
    if (!activeSemester) throw new NotFoundError("No active semester found");

    const cacheKey = `courses:eligible:${studentId}:${activeSemester._id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const student = await Student.findById(studentId).select("department level");
    if (!student) throw new NotFoundError("Student not found");

    const courses = await CourseModel.find({
      department: student.department,
      level: student.level,
      semester: activeSemester.name,
      isActive: true,
    })
      .populate("department", "name code")
      .sort({ title: 1 });

    await redisClient.setex(cacheKey, 21600, JSON.stringify(courses));
    return courses;
  }
}