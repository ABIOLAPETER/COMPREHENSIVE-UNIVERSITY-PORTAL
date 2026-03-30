
import bcrypt from "bcryptjs";
import Lecturer from "../Lecturer/models/lecturer.models";
import Student, { StudentStatus } from "../student/models/student.model";
import { CourseModel } from "../course/models/course.model";
import { RegistrationModel, RegistrationStatus } from "../registration/models/registration.model";
import { ResultModel, ResultStatus } from "../result/models/result.model";
import { UserModel } from "../identity/models/identity.models";
import { RefreshToken } from "../identity/models/refresh-token.model";
import { NotFoundError } from "../../shared/errors/AppError";

export class AdminService {
  private static readonly SALT_ROUNDS = 12;

  static async getDashboardStats() {

    const [
      activeStudentsCount,
      lecturerCount,
      courseCount,
      pendingRegistrations,
      approvedRegistrations,
      publishedResults,
      draftResults,
      totalUsers,
    ] = await Promise.all([
      Student.countDocuments({status: StudentStatus.ACTIVE}),
      Lecturer.countDocuments({ isActive: true }),
      CourseModel.countDocuments({ isActive: true }),
      RegistrationModel.countDocuments({ status: RegistrationStatus.SUBMITTED }),
      RegistrationModel.countDocuments({ status: RegistrationStatus.APPROVED }),
      ResultModel.countDocuments({ status: ResultStatus.PUBLISHED }),
      ResultModel.countDocuments({ status: ResultStatus.DRAFT }),
      UserModel.countDocuments(),
    ]);

    return {
      activeStudentsCount,
      lecturerCount,
      courseCount,
      totalUsers,
      registrations: {
        pending:  pendingRegistrations,
        approved: approvedRegistrations,
      },
      results: {
        published: publishedResults,
        draft:     draftResults,
      },
    };
  }

  static async getAllStudents() {
    const students = await Student.find()
      .populate("department", "name code")
      .populate("faculty", "name code")
      .sort({ lastName: 1 });

    return students;
  }

  static async getAllLecturers() {
    const lecturers = await Lecturer.find({ isActive: true })
      .populate("department", "name code")
      .populate("courses", "title code creditUnits")
      .sort({ lastName: 1 });

    return lecturers;
  }

 
static async getAllCourses() {
  const courses = await CourseModel.find()
    .populate("department", "name code")
    .select("title code creditUnits type level semester isActive")
    .sort({ code: 1 });

  return courses;
}

  static async resetUserPassword(userId: string){
    const user =await UserModel.findById(userId)
    if(!user){
        throw new NotFoundError("user not found")
    }
    const newPassword = "ChangeMe123!"

  const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

  await UserModel.findByIdAndUpdate(userId, {passwordHash})

   // Revoke all refresh tokens — force re-login on all devices
    await RefreshToken.updateMany(
      { userId, revoked: false },
      { $set: { revoked: true } }
    );
  
    return "Password reset successful";
  }

}
