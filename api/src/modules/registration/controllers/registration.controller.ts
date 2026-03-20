import { NextFunction, Request, Response } from "express";
import { RegistrationService } from "../services/registrationService";
import { NotFoundError } from "../../../shared/errors/AppError";
import { AddCourseDto } from "../dtos/registration.dtos";
import Student from "../../student/models/student.model";
import { RegistrationStatus } from "../models/registration.model";
export class RegistrationController {

  // ── Helper: get the student profile using the userId stored in the JWT ──────
  private static async getStudentIdFromToken(req: Request): Promise<string> {
    const userId = req.user?.userId;

    if (!userId) {
      throw new NotFoundError("User not authenticated");
    }

    const student = await Student.findOne({ user: userId }).select("_id");

    if (!student) {
      throw new NotFoundError("Student profile not found for this user");
    }

    return student._id.toString();
  }

  // POST /registrations/draft
  static async createDraftReg(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Derive studentId from the JWT — never trust it from the body
      const studentId = await RegistrationController.getStudentIdFromToken(req);

      const registration = await RegistrationService.createDraftRegistration({ studentId });

      return res.status(201).json({
        success: true,
        message: "Draft registration created successfully",
        data: registration,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /registrations/current
  static async getDraftReg(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const studentId = await RegistrationController.getStudentIdFromToken(req);
      const registration = await RegistrationService.getDraftRegistration(studentId);

      return res.status(200).json({
        success: true,
        message: "Draft registration fetched",
        data: registration,
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /registrations/:registrationId/courses
  static async addCourseToReg(
    req: Request<{ registrationId: string }, {}, AddCourseDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const registration = await RegistrationService.addCourseToRegistration({
        registrationId: req.params.registrationId,
        courseId: req.body.courseId,
      });

      return res.status(200).json({
        success: true,
        message: "Course added to registration",
        data: registration,
      });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /registrations/:registrationId/courses/:courseId
  static async removeCourseFromReg(
    req: Request<{ registrationId: string; courseId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const registration = await RegistrationService.removeCourseFromRegistration(req.params);

      return res.status(200).json({
        success: true,
        message: "Course removed from registration",
        data: registration,
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /registrations/:registrationId/submit
  static async submitReg(
    req: Request<{ registrationId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const registration = await RegistrationService.submitRegistration(req.params.registrationId);

      return res.status(200).json({
        success: true,
        message: "Registration submitted successfully",
        data: registration,
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /registrations/:registrationId/approve
  static async approveRegistration(
    req: Request<{ registrationId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const registration = await RegistrationService.approveRegistration(req.params.registrationId);

      return res.status(200).json({
        success: true,
        message: "Registration approved successfully",
        data: registration,
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /registrations/:registrationId/reject
  static async rejectRegistration(
    req: Request<{ registrationId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const registration = await RegistrationService.rejectRegistration(req.params.registrationId);

      return res.status(200).json({
        success: true,
        message: "Registration rejected successfully",
        data: registration,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /registrations
  static async getAllRegistrations(
    req: Request<{}, {}, {}, { status?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
          const status = req.query.status as RegistrationStatus | "ALL" | undefined;

      const registrations = await RegistrationService.getAllRegistrations(status);

      return res.status(200).json({
        success: true,
        message: "Registrations fetched successfully",
        data: registrations,
      });
    } catch (err) {
      next(err);
    }
  }
}