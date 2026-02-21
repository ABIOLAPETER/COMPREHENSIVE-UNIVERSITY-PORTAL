
import { Semester } from "../models/course.model";
import { CourseType } from "../models/course.model";
import { CourseModel, ICourse } from "../models/course.model";
import mongoose from "mongoose";
import { validateCourseCreation } from "../../../shared/utils/validate";
import { ConflictError } from "../../../shared/errors/AppError";
import Student from "../../student/models/student.model";
import { NotFoundError } from "../../../shared/errors/AppError";
import { SessionService } from "../../session/services/session.services";
import { SemesterService } from "../../semester/services/semester.services";
export class CourseService {
    static async createCourse(data: {
        title: string;
        code: string;
        creditUnits: number;
        department: mongoose.Types.ObjectId;
        semester: Semester;
        level: number;
        type: CourseType;
    }) {
        const validatedData = validateCourseCreation(data);
        if (!validatedData) {
            throw new Error("Invalid course data");
        }
        if (await CourseModel.findOne({ department: validatedData.department, code: validatedData.code })) {
            throw new ConflictError("Course code must be unique within the department");
        }
        const course = new CourseModel(validatedData);
        await course.save();
        return course;
    }

    static async updateCourse(courseId: string, data: Partial<Pick<ICourse, "title" | "creditUnits" | "type" | "isActive">>) {
        const course = await CourseModel.findById(courseId);
        if (!course) {
            throw new Error("Course not found");
        }
        if (data.title !== undefined) course.title = data.title;
        if (data.creditUnits !== undefined) course.creditUnits = data.creditUnits;
        if (data.type !== undefined) course.type = data.type;
        if (data.isActive !== undefined) course.isActive = data.isActive;

        await course.save();
        return course;
    }


    static async listEligibleCoursesForStudent(studentId: string) {

        const student = await Student.findById(studentId).select("department level");

        if (!student) {
            throw new NotFoundError("Student not found");
        }        

        const activeSemester = await SemesterService.getActiveSemester();
            if (!activeSemester) {
                throw new NotFoundError("No active semester found");
            }
        
        const eligibleCourses = await CourseModel.find({
            department: student.department,
            level: student.level,
            semester: activeSemester.name,
            isActive: true,
        }).populate("department", "name code").sort({ title: 1 });
        return eligibleCourses;
    }
 

}