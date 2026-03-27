import Student from "../../modules/student/models/student.model";
import { NotFoundError } from "../errors/AppError";
import { Request } from "express";
import Lecturer from "../../modules/Lecturer/models/lecturer.models";
export async function getStudentIdFromRequest(req: Request): Promise<string> {
  const userId = req.user?.userId;
  if (!userId) throw new NotFoundError("User not authenticated");

  const student = await Student.findOne({ user: userId }).select("_id");
  if (!student) throw new NotFoundError("Student profile not found");

  return student._id.toString();
}

export async function getLecturerIdFromRequest(req: Request): Promise<string> {
  const userId = req.user?.userId;
  const lecturer = await Lecturer.findOne({ user: userId }).select("_id");
  if (!lecturer) throw new NotFoundError("Lecturer profile not found");
  return lecturer._id.toString();
}