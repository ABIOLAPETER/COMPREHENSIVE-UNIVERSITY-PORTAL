import { Request, Response } from "express";
import { RegistrationService } from "../services/registrationService";
import { AppError } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/utils/logger";
import Student from "../../student/models/student.model";
import { NotFoundError } from "../../../shared/errors/AppError";

export class RegistrationController {

  // ── Helper: get the student profile using the userId stored in the JWT ──────
  // Your JWT contains userId (the auth user's _id), not studentId (the student profile _id).
  // We use it to look up the student profile and get the real studentId safely,
  // so a student can never forge someone else's studentId in the request.
  private static async getStudentIdFromToken(req: Request): Promise<string> {
    // validateToken sets req.user = { userId: decoded.sub, role: decoded.role }
    const userId = (req as any).user?.userId;

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
  static async createDraftReg(req: Request, res: Response) {
    try {
      // Derive studentId from the JWT — never trust it from the body
      const studentId = await RegistrationController.getStudentIdFromToken(req);

      const registration = await RegistrationService.createDraftRegistration(studentId);

      return res.status(201).json({
        message: "Draft registration created successfully",
        registration,
      });
    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET /registrations/current
  // Returns the student's registration for the active semester — DRAFT or SUBMITTED
  // studentId derived from the JWT token
  static async getDraftReg(req: Request, res: Response) {
    try {
      const studentId = await RegistrationController.getStudentIdFromToken(req);
      // req.query values are typed as string | string[] | ParsedQs — cast explicitly
      const registration = await RegistrationService.getDraftRegistration(studentId as string);

      return res.status(200).json({
        message: "Draft registration fetched",
        registration,
      });
    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST /registrations/:registrationId/courses
  static async addCourseToReg(req: Request, res: Response) {
    try {
      const { registrationId } = req.params as Record<string, string>;
      const { courseId }       = req.body;

      if (!courseId) {
        return res.status(400).json({ error: "courseId is required in request body" });
      }

      const registration = await RegistrationService.addCourseToRegistration({
        registrationId,
        courseId,
      });

      return res.status(200).json({
        message: "Course added to registration",
        registration,
      });
    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE /registrations/:registrationId/courses/:courseId
  static async removeCourseFromReg(req: Request, res: Response) {
    try {
      const { registrationId, courseId } = req.params as Record<string, string>;

      const registration = await RegistrationService.removeCourseFromRegistration({
        registrationId,
        courseId,
      });

      return res.status(200).json({
        message: "Course removed from registration",
        registration,
      });
    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PATCH /registrations/:registrationId/submit
  static async submitReg(req: Request, res: Response) {
    try {
      const { registrationId } = req.params as Record<string, string>;;

      const registration = await RegistrationService.submitRegistration(registrationId);

      return res.status(200).json({
        message: "Registration submitted successfully",
        registration,
      });
    } catch (err) {
      logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async approveRegistration(req: Request, res: Response){
    
    try {
        const {registrationId} = req.params as Record<string, string>;

        const updatedRegistration = await RegistrationService.approveRegistration(registrationId)

        return res.status(200).json({
        message: "Registration updated successfully",
        updatedRegistration,
      });
    } catch (err) {
        logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
   
  }
  static async rejectRegistration(req: Request, res: Response){
    
    try {
        const {registrationId} = req.params as Record<string, string>;

        const updatedRegistration = await RegistrationService.rejectRegistration(registrationId)

        return res.status(200).json({
        message: "Registration updated successfully",
        updatedRegistration,
      });
    } catch (err) {
        logger.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
   
  }

  static async getAllRegistrations(req: Request, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    const registrations = await RegistrationService.getAllRegistrations(status);
    return res.status(200).json({ registrations });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
    return res.status(500).json({ error: "Failed to fetch registrations" });
  }
}
}