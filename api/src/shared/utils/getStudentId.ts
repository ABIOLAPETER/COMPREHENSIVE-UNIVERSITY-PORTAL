import Student from "../../modules/student/models/student.model";
import { NotFoundError } from "../errors/AppError";
import { Request } from "express";

export async function getStudentIdFromRequest(req: Request): Promise<string> {
  const userId = req.user?.userId;
  if (!userId) throw new NotFoundError("User not authenticated");

  const student = await Student.findOne({ user: userId }).select("_id");
  if (!student) throw new NotFoundError("Student profile not found");

  return student._id.toString();
}