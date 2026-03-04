import mongoose from "mongoose";
import { CourseModel, ICourse, CourseType, Semester } from "../models/course.model";
import { DepartmentModel } from "../../department/models/department.model";
import Student from "../../student/models/student.model";
import { SessionService } from "../../session/services/session.services";
import { SemesterService } from "../../semester/services/semester.services";
import { validateCourseCreation } from "../../../shared/utils/validate";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError";
import { getLevelAndSemester } from "../../../shared/utils/getLevelAndsemesterFromCode";

export class CourseService {

  // ── Create ──────────────────────────────────────────────────────────────────

 static async createCourse(data: {
  title: string;
  code: string;
  creditUnits: number;
  department: mongoose.Types.ObjectId | string;
  type: CourseType;
}) {
  const { level, semester } = getLevelAndSemester(data.code);
const courseData = { ...data, level, semester };
const validatedData = validateCourseCreation(courseData);

  if (!validatedData) {
    throw new Error("Invalid course data");
  }

  const existing = await CourseModel.findOne({
    department: validatedData.department,
    code: validatedData.code,
  });

  if (existing) {
    throw new ConflictError("Course code must be unique within the department");
  }

  const course = new CourseModel(validatedData);
  await course.save();
  return course;
}

  // ── Read by department ───────────────────────────────────────────────────────

  static async getCoursesByDepartment(departmentId: string) {
    const department = await DepartmentModel.findById(departmentId);

    if (!department) {
      throw new NotFoundError("Department not found");
    }

    // FIX 1: was `{ department._id: departmentId }` — invalid syntax, correct key is "department"
    // FIX 2: was `.populate("title")` — title is a plain string, not a ref. populate("department") instead
    const courses = await CourseModel.find({ department: departmentId })
      .populate("department", "name code")
      .sort({ title: 1 });

    // FIX 3: was returning a string on empty — always return an array so the caller can safely do .length / .map
    return courses;
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  static async updateCourse(
    courseId: string,
    data: Partial<Pick<ICourse, "title" | "creditUnits" | "type" | "isActive">>
  ) {
    // FIX 4: was using findById + manual field assignment + save() — findByIdAndUpdate is cleaner
    // `new: true` returns the updated document, `runValidators` respects schema rules
    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!course) {
      throw new NotFoundError("Course not found"); // FIX 5: was generic Error, should be NotFoundError
    }

    return course;
  }

  // ── Eligible courses for a student ──────────────────────────────────────────

  static async listEligibleCoursesForStudent(studentId: string) {
    const student = await Student.findById(studentId).select("department level");

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    const activeSemester = await SemesterService.getActiveSemester();

    if (!activeSemester) {
      throw new NotFoundError("No active semester found");
    }

    const courses = await CourseModel.find({
      department: student.department,
      level: student.level,
      semester: activeSemester.name,
      isActive: true,
    })
      .populate("department", "name code")
      .sort({ title: 1 });

    return courses;
  }
}