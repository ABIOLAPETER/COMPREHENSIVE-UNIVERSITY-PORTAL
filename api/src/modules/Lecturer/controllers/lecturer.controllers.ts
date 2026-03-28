import { Response, Request, NextFunction } from "express";
import { createLecturerDto, updateLecturerDto } from "../dtos/lecturer.dtos";
import { LecturerService } from "../services/lecturer.services";
import { getLecturerIdFromRequest } from "../../../shared/utils/getIds";

export class LecturerController {

  static async createLecturer(
    req: Request<{}, {}, createLecturerDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const lecturer = await LecturerService.createLecturer(req.body);
      return res.status(201).json({
        success: true,
        message: "Lecturer created successfully",
        data: lecturer,
      });
    } catch (error) {
      next(error);
    }
  }


  static async assignCourse(
    req: Request<{ lecturerId: string; courseId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { lecturerId, courseId } = req.params;
      const result = await LecturerService.assignCourse(lecturerId, courseId);
      return res.status(200).json({
        success: true,
        message: "Course assigned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }


  static async removeCourse(
    req: Request<{ lecturerId: string; courseId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { lecturerId, courseId } = req.params;
      const result = await LecturerService.removeCourse(lecturerId, courseId);
      return res.status(200).json({
        success: true,
        message: "Course removed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCourses(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const lecturerId = await getLecturerIdFromRequest(req);
      const result     = await LecturerService.viewAssignedCourses(lecturerId);
      return res.status(200).json({
        success: true,
        message: "Courses fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudents(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const lecturerId = await getLecturerIdFromRequest(req);
      const result     = await LecturerService.getRegisteredStudentsForMyCourses(lecturerId);
      return res.status(200).json({
        success: true,
        message: "Students fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }


  static async uploadResults(
    req: Request<{ courseId: string }, {}, { results: { studentId: string; score: number }[] }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const lecturerId = await getLecturerIdFromRequest(req);
      const { courseId } = req.params;
      const { results }  = req.body;

      if (!results || !Array.isArray(results) || results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "results array is required and cannot be empty",
        });
      }

      const result = await LecturerService.uploadStudentResultForMyCourse(
        lecturerId,
        courseId,
        results
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          matched:  result.matched,
          modified: result.modified,
        },
      });
    } catch (error) {
      next(error);
    }
  }


  static async viewResults(
    req: Request<{ courseId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const lecturerId   = await getLecturerIdFromRequest(req);
      const { courseId } = req.params;
      const results      = await LecturerService.viewResultsForCourse(lecturerId, courseId);
      return res.status(200).json({
        success: true,
        message: "Results fetched successfully",
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const lecturerId = await getLecturerIdFromRequest(req);
      const result     = await LecturerService.viewProfile(lecturerId);
      return res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /lecturers/profile — Lecturer only
  static async updateProfile(
    req: Request<{}, {}, Partial<updateLecturerDto>>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const lecturerId = await getLecturerIdFromRequest(req);
      const result     = await LecturerService.updateProfile(req.body, lecturerId);
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}