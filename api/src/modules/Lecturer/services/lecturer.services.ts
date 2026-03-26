// {
//   userId: ObjectId,          // ref User — for auth
//   staffId: string,           // unique staff ID e.g "STAFF/2020/001"
//   firstName: string,
//   lastName: string,
//   department: ObjectId,      // ref Department
//   faculty: ObjectId,         // ref Faculty
//   courses: ObjectId[],       // courses assigned to this lecturer
//   isActive: boolean,
//   createdAt: Date
// }
// ```
import { CounterService } from "./counter.service";
import { BadRequestError, NotFoundError, ValidationError, ConflictError } from "../../../shared/errors/AppError";
import { generateStaffId } from "../../../shared/utils/generateMatricNumber";
import { DepartmentModel } from "../../department/models/department.model";
import { FacultyModel } from "../../faculty/models/faculty.model";
import { createLecturerDto } from "../dtos/lecturer.dtos";
import mongoose from "mongoose";
import Lecturer from "../models/lecturer.models";
import { UserModel } from "../../identity/models/identity.models";
// ---

// ### What a Lecturer can do

export class LecturerService {
static async createLecturer(data: createLecturerDto) {
  const { email, firstName, lastName, departmentId } = data;

  if (!email || !firstName || !lastName || !departmentId) {
    throw new ValidationError("Missing credentials");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Check duplicate email
    const existingLecturer = await Lecturer
      .findOne({ email: normalizedEmail })
      .session(session);

    if (existingLecturer) {
      throw new ConflictError("Lecturer already exists");
    }

    // ✅ Get department
    const department = await DepartmentModel
      .findById(departmentId)
      .select("code faculty")
      .session(session);

    if (!department) {
      throw new NotFoundError("Invalid department");
    }

    // ✅ Get faculty
    const faculty = await FacultyModel
      .findById(department.faculty)
      .select("code")
      .session(session);

    if (!faculty) {
      throw new NotFoundError("Invalid faculty");
    }

    // ✅ Generate staff ID
    const sequence = await CounterService.generateSequence(
      new Date().getFullYear(),
      session
    );

    const staffId = generateStaffId(
      faculty.code,
      department.code,
      new Date().getFullYear(),
      sequence
    );

    const 

    const [user] = await UserModel.create([{
            email,
            lastName
            firstName
            passwordHash,
            isEmailVerified: false,
            role: Role.STUDENT,
          }], { session });
    // ✅ Create lecturer
    const [lecturer] = await Lecturer.create([{
      email: normalizedEmail,
      department: departmentId,
      faculty: faculty._id,
      firstName,
      lastName,
      staffId,
      isActive: true
    }], { session });

    
    await session.commitTransaction();

    return {
      id: lecturer._id,
      email: lecturer.email,
      staffId: lecturer.staffId,
      name: `${lecturer.firstName} ${lecturer.lastName}`,
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
// **1. View their assigned courses**
// ```
// GET /lecturers/my-courses
// ```

// **2. View students registered for a specific course**
// ```
// GET /lecturers/courses/:courseId/students
// ```
// Returns all students with APPROVED registrations that include this course.

// **3. Enter results for a course**
// ```
// POST /lecturers/courses/:courseId/results
// Body: [{ studentId, score }]
// ```
// This is the big one — bulk result entry for a course.

// **4. View results they've entered**
// ```
// GET /lecturers/courses/:courseId/results
// ```

// **5. View their own profile**
// ```
// GET /lecturers/profile
// ```

// ---

// ### How lecturers are created

// Two approaches:

// **Option A — Admin creates lecturer accounts:**
// ```
// POST /admin/lecturers
// Body: { email, firstName, lastName, departmentId, staffId }
// ```
// Admin creates the account, system generates a temporary password, lecturer gets an email to activate.

// **Option B — Similar to your admission flow:**
// Lecturer gets an activation link, sets their password, account is created.

// Option A is simpler since lecturers are few and admin-managed.

// ---

// ### Result entry flow
// ```
// Admin publishes results → 
// Lecturer enters scores → 
// System calculates grade automatically → 
// Admin reviews and publishes