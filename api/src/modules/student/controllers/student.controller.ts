import { NextFunction, Request, Response } from "express";
import { StudentService } from "../services/student.service";
import { UpdateStudentDto } from "../dtos/student.dtos";

export class StudentController {

  static async updateStudent(
    req: Request<{ studentId: string }, {}, UpdateStudentDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const student = await StudentService.updateStudent({
        ...req.body,
        studentId: req.params.studentId,
      });

      return res.status(200).json({
        success: true,
        message: "Student updated successfully",
        data: student,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentProfile(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const studentProfile = await StudentService.getStudentProfile(req.params.userId);

      return res.status(200).json({
        success: true,
        message: "Student profile fetched successfully",
        data: studentProfile,
      });
    } catch (err) {
      next(err);
    }
  }
}