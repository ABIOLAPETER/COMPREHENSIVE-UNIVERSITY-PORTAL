import { Request, Response } from "express";
import { SemesterService } from "../services/semester.services";
import { AppError } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/utils/logger";

export class SemesterController {

  // POST /semesters
  static async createSemester(req: Request, res: Response) {
    try {
      const { name, sessionId } = req.body;

      const semester = await SemesterService.createSemester({ name, sessionId });

      return res.status(201).json({ message: "Semester created successfully", semester });

    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PATCH /semesters/:semesterId/activate
  static async activateSemester(req: Request, res: Response) {
    try {
      const { semesterId } = req.params;

      const semester = await SemesterService.activateSemester(semesterId.toString());

      return res.status(200).json({ message: "Semester activated successfully", semester });

    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PATCH /semesters/lock
  static async lockSemester(req: Request, res: Response) {
    try {
      // FIX: was returning 200 without ever calling the service
      const semester = await SemesterService.lockRegistration();

      return res.status(200).json({ message: "Semester locked successfully", semester });

    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /semesters/active  — called by courseRegistration.js
  static async getActiveSemester(req: Request, res: Response) {
    try {
      const semester = await SemesterService.getActiveSemester();

      return res.status(200).json({ message: "Active semester fetched", semester });

    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}