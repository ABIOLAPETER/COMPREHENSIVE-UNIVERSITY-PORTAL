import { NextFunction, Request, Response } from "express";
import { SemesterService } from "../services/semester.services";
import { CreateSemesterDto } from "../dtos/semester.dtos";

export class SemesterController {

  // POST /semesters
  static async createSemester(
    req: Request<{}, {}, CreateSemesterDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const semester = await SemesterService.createSemester(req.body);
      return res.status(201).json({
        success: true,
        message: "Semester created successfully",
        data: semester,
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /semesters/:semesterId/activate
  static async activateSemester(
    req: Request<{ semesterId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const semester = await SemesterService.activateSemester(req.params.semesterId);
      return res.status(200).json({
        success: true,
        message: "Semester activated successfully",
        data: semester,
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /semesters/lock
  static async lockSemester(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const semester = await SemesterService.lockRegistration();
      return res.status(200).json({
        success: true,
        message: "Semester locked successfully",
        data: semester,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /semesters/active
  static async getActiveSemester(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const semester = await SemesterService.getActiveSemester();
      return res.status(200).json({
        success: true,
        message: "Active semester fetched",
        data: semester,
      });
    } catch (err) {
      next(err);
    }
  }
}