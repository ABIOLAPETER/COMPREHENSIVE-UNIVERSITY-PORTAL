import { Request, Response, NextFunction } from "express";
import { CourseService } from "../services/course.service";
import { CreateCourseDto, UpdateCourseDto } from "../dtos/course.dtos";

export class CourseController {

  static async createCourse(
    req: Request<{}, {}, CreateCourseDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const course = await CourseService.createCourse(req.body);
      return res.status(201).json({
        success: true,
        message: "Course created",
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCoursesByDepartment(
    req: Request<{}, {}, {}, { department: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { department } = req.query;

      if (!department || typeof department !== "string") {
        return res.status(400).json({
          success: false,
          message: "department query param is required",
        });
      }

      const courses = await CourseService.getCoursesByDepartment(department);
      return res.status(200).json({
        success: true,
        message: "Courses fetched",
        data: courses,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCourse(
    req: Request<{ courseId: string }, {}, UpdateCourseDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { courseId } = req.params;
      const course = await CourseService.updateCourse(courseId, req.body);
      return res.status(200).json({
        success: true,
        message: "Course updated",
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEligibleCourses(
    req: Request<{ studentId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { studentId } = req.params;
      const courses = await CourseService.listEligibleCoursesForStudent(studentId);
      return res.status(200).json({
        success: true,
        message: "Eligible courses fetched",
        data: courses,
      });
    } catch (error) {
      next(error);
    }
  }
}