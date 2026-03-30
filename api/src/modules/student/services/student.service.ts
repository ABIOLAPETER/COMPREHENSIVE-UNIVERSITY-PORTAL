import { AdmissionType, IStudent } from "../models/student.model";
import Student from "../models/student.model";
import { DepartmentModel } from "../../department/models/department.model";
import { generateMatricNumber } from "../../../shared/utils/generateMatricNumber";
import { RegistrationStatus } from "../../registration/models/registration.model";
import { RegistrationModel } from "../../registration/models/registration.model";
import { FacultyModel } from "../../faculty/models/faculty.model";
import { BadRequestError, NotFoundError } from "../../../shared/errors/AppError";
import { CounterService } from "./counter.service";
import { redisClient } from "../../../shared/utils/redis";
import { UpdateStudentDto } from "../dtos/student.dtos";
import mongoose from "mongoose";

export class StudentService {

  // static async updateStudent(data: UpdateStudentDto & { studentId: string }): Promise<IStudent> {
    // const session = await mongoose.startSession();
    // session.startTransaction();

    // try {
    //   const student = await Student.findById(data.studentId).session(session);
    //   if (!student) throw new NotFoundError("Student not found");

    //   const department = await DepartmentModel
    //     .findById(data.departmentId)
    //     .select("code faculty")
    //     .session(session);
    //   if (!department) throw new NotFoundError("Department not found");

    //   const faculty = await FacultyModel
    //     .findById(department.faculty)
    //     .select("code")
    //     .session(session);
    //   if (!faculty) throw new NotFoundError("Faculty not found");

    //   const sequence = await CounterService.generateSequence(
    //     new Date().getFullYear(),
    //     session
    //   );

    //   const matricNumber = generateMatricNumber(
    //     faculty.code,
    //     department.code,
    //     new Date().getFullYear(),
    //     sequence
    //   );

    //   let level = data.level;
    //   if (data.admissionType === AdmissionType.DIRECT_ENTRY) {
    //     level = 200;
    //   } else if (data.admissionType === AdmissionType.TRANSFER) {
    //     level = level ?? 100;
    //   }

    //   const updated = await Student.findByIdAndUpdate(
    //     data.studentId,
    //     {
    //       department: department._id,
    //       faculty: faculty._id,
    //       matricNumber,
    //       level,
    //       admissionType: data.admissionType,
    //     },
    //     { new: true, session }
    //   ).populate("department").populate("user");
    //   if (!updated){
    //     throw new BadRequestError("cannot update")
    //   }

    //   await session.commitTransaction();

    //   // Invalidate student profile cache
    //   await redisClient.del(`student:user:${updated.user}`);

    //   return updated;

    // } catch (error) {
    //   await session.abortTransaction();
    //   throw error;
    // } finally {
    //   session.endSession();
    // }
  // }

  static async getStudentProfile(studentId: string): Promise<IStudent> {
    const cacheKey = `student:student:${studentId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const student = await Student.findById(studentId)
      .populate("department")
      .populate("user");

    if (!student) throw new NotFoundError("Student not found");

    await redisClient.setex(cacheKey, 21600, JSON.stringify(student));
    return student;
  }

    static async getAllApprovedRegistrations(studentId: string) {
  const student = await Student.findById(studentId);
  if (!student) throw new NotFoundError("Student not found");

  const registrations = await RegistrationModel.find({
    student: student._id,
    status:  RegistrationStatus.APPROVED,
  })
    .populate("department", "name code")
    .populate("courses.course", "code title creditUnits type")
    .sort({ createdAt: -1 });

  return registrations;
}

}