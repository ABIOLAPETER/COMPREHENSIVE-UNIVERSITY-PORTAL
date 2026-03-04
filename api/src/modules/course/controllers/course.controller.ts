import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { logger } from "../../../shared/utils/logger";

export class CourseController {

  // POST /courses
  // department is part of the body because Course owns the relationship — not Department
  static async createCourse(req: Request, res: Response) {
    try {
      const { title, code, creditUnits, department, type } = req.body;
      // level & semester are derived from `code` inside CourseService via getLevelAndSemester()

      const course = await CourseService.createCourse({
        title,
        code,
        creditUnits,
        department,
        type,
      });

      return res.status(201).json({ message: "Course created", course });

    } catch (error) {
      logger.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Could not create course",
      });
    }
  }

  // GET /courses?department=:departmentId
  // filter courses by department using a query param — not a nested route
  static async getCoursesByDepartment(req: Request, res: Response) {
    try {
      const { department } = req.query;

      if (!department || typeof department !== "string") {
        return res.status(400).json({ error: "department query param is required" });
      }

      const courses = await CourseService.getCoursesByDepartment(department);

      return res.status(200).json({ message: "Courses fetched", courses });

    } catch (error) {
      logger.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Could not fetch courses",
      });
    }
  }

  // PATCH /courses/:courseId
  static async updateCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const data = req.body;

      const course = await CourseService.updateCourse(courseId.toString(), data);

      return res.status(200).json({ message: "Course updated", course });

    } catch (error) {
      logger.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Could not update course",
      });
    }
  }

  // GET /courses/eligible/:studentId
  static async getEligibleCourses(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const courses = await CourseService.listEligibleCoursesForStudent(studentId.toString());

      return res.status(200).json({ message: "Eligible courses fetched", courses });

    } catch (error) {
      logger.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Could not get eligible courses",
      });
    }
  }
}