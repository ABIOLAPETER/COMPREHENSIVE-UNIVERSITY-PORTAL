import { NextFunction, Request, Response } from "express";
import { StudentService } from "../services/student.service";
import { UpdateStudentDto } from "../dtos/student.dtos";
import { getStudentIdFromRequest } from "../../../shared/utils/getIds";

export class StudentController {
// No more updating of student for now as signup method has been changed to an activation approach 
  // static async updateStudent(
  //   req: Request<{ studentId: string }, {}, UpdateStudentDto>,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   try {
  //     const student = await StudentService.updateStudent({
  //       ...req.body,
  //       studentId: req.params.studentId,
  //     });

  //     return res.status(200).json({
  //       success: true,
  //       message: "Student updated successfully",
  //       data: student,
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // }

  static async getStudentProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const studentId = await getStudentIdFromRequest(req)
      const studentProfile = await StudentService.getStudentProfile(studentId);

      return res.status(200).json({
        success: true,
        message: "Student profile fetched successfully",
        data: studentProfile,
      });
    } catch (err) {
      next(err);
    }
  }
  static async getAllApprovedRegistrations(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const studentId = await getStudentIdFromRequest(req)
      const registrations = await StudentService.getAllApprovedRegistrations(studentId)
      return res.status(200).json({
        success: true,
        message: "registrationsfetched successfully",
        data: registrations,
      });
    } catch (err) {
      next(err);
    }
  }
}