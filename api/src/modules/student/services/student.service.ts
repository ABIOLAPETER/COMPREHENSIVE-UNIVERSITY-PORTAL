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

export class StudentService {
  // Implement student-related business logic here


  static async createStudent(data: {
    firstName: string;
    lastName: string;
    departmentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    dateOfBirth?: Date;
    level?: number;
    admissionType: AdmissionType;
    admissionYear: Date;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

      const validatedData = await validateStudentCreation(data);

      const user = await UserModel.findById(validatedData.userId).session(session);
      if (!user) throw new NotFoundError("User not found");
      if (user.role !== "STUDENT") throw new Error("User must have STUDENT role");

      const department = await DepartmentModel
        .findById(validatedData.departmentId)
        .select("code faculty")
        .session(session);

      if (!department) throw new NotFoundError("Department not found");

      const faculty = await FacultyModel
        .findById(department.faculty)
        .select("code")
        .session(session);

      if (!faculty) throw new NotFoundError("Faculty not found");

      const sequence = await CounterService.generateSequence(
        {
          facultyCode: faculty.code,
          departmentCode: department.code,
          year: validatedData.admissionYear.getFullYear(),
        },
        session
      );

      const matricNumber = generateMatricNumber(
        faculty.code,
        department.code,
        validatedData.admissionYear.getFullYear(),
        sequence
      );

      if (validatedData.admissionType === AdmissionType.DIRECT_ENTRY) {
        validatedData.level = 200;
      } else if (validatedData.admissionType === AdmissionType.TRANSFER) {
        validatedData.level = validatedData.level ?? 100;
      }

      await Student.create(
        [
          {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            dateOfBirth: validatedData.dateOfBirth,
            department: department._id,
            faculty: faculty._id,
            user: validatedData.userId,
            matricNumber,
            level: validatedData.level,
            admissionType: validatedData.admissionType,
          },
        ],
        { session }
      );
      await session.commitTransaction();
      session.endSession();

      return { matricNumber };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  // Get student profile


  static async getStudentProfile(studentId: string) {
    const student = await Student.findById(studentId).populate("department").populate("user");
    if (!student) {
      throw new NotFoundError("Student not found");
    }
    return student;
  }




}