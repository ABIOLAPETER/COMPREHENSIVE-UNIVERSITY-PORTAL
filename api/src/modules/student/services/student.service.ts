import { AdmissionType } from "../models/student.model";
import { UserModel } from "../../identity/models/identity.models";
import Student from "../models/student.model";
import { DepartmentModel } from "../../department/models/department.model";
import { generateMatricNumber } from "../../../shared/utils/generateMatricNumber";
import { validateStudentCreation } from "../../../shared/utils/validate";
import { FacultyModel } from "../../faculty/models/faculty.model";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError";
import { CounterService } from './counter.service'
import mongoose from "mongoose";
import { Types } from "mongoose";
export class StudentService {
  // Implement student-related business logic here


  static async updateStudent(data: {
    departmentId: mongoose.Types.ObjectId;
    studentId: string;    
    dateOfBirth?: Date;
    level?: number;
    admissionType: AdmissionType;

  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

      // const validatedData = await validateStudentCreation(data);

      const student = await Student.findById(data.studentId).session(session);
      if (!student) throw new NotFoundError("Student not found");

      const department = await DepartmentModel
        .findById(data.departmentId)
        .select("code faculty")
        .session(session);

      if (!department) throw new NotFoundError("Department not found");

      const faculty = await FacultyModel
        .findById(department.faculty)
        .select("code")
        .session(session);

      if (!faculty) throw new NotFoundError("Faculty not found");

      const sequence = await CounterService.generateSequence(
        new Date().getFullYear(),
        session
      );

      const matricNumber = generateMatricNumber(
        faculty.code,
        department.code,
        new Date().getFullYear(),
        sequence
      );

      if (data.admissionType === AdmissionType.DIRECT_ENTRY) {
        data.level = 200;
      } else if (data.admissionType === AdmissionType.TRANSFER) {
        data.level = data.level ?? 100;
      }

      await Student.findByIdAndUpdate(
        data.studentId,
        {
          department: department._id,
          faculty: faculty._id,
          matricNumber,
          level: data.level,
          admissionType: data.admissionType,
        },
        { session }
      );

    await session.commitTransaction();
    session.endSession();

    return { matricNumber };

  } catch(error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
  }


  // Get student profile


  static async getStudentProfile(userId: string) {
  const student = await Student.findOne(
    {
      user: userId
    }
  ).populate("department").populate("user");
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}




}