import { RegistrationModel, RegistrationStatus } from "../models/registration.model";
import Student from "../../student/models/student.model";
import { CourseModel } from "../../course/models/course.model";
import { NotFoundError, ConflictError, BadRequestError } from "../../../shared/errors/AppError";
import mongoose from "mongoose";
import { ResultModel } from "../../result/models/result.model"

import { SemesterService } from "../../semester/services/semester.services";
import { SessionService } from "../../session/services/session.services";
import { SemesterNames } from "../../semester/model/semester.model";

export class RegistrationService {


    static async createDraftRegistration( studentId: string) {

        const student = await Student.findById(studentId);
        if (!student) {
            throw new NotFoundError("Student not found");
        }

        
        const activeSemester = await SemesterService.getActiveSemester();
        if (!activeSemester) {
            throw new NotFoundError("No active semester found");
        }
        
        const activeSession = await SessionService.getActiveSession();
        if (!activeSession) {
            throw new NotFoundError("No active session found");
        }
        
        const existingRegistration = await RegistrationModel.findOne({student: studentId, semester: activeSemester.name, session: activeSession.name });

        if (existingRegistration) {
            throw new ConflictError("A registration already exists for this student in the specified session and semester.");
        }
        
        const registration = new RegistrationModel({
            student: student._id,
            session: activeSession.name,
            semester: activeSemester.name,
            status: "DRAFT",
            level: student.level,
            department: student.department,
            totalCredits: 0,
            courses: [],
        });

        await registration.save();

        return registration;

    }

    static async addCourseToRegistration(data: {
        registrationId: string;
        courseId: string;
    }) {
        const registration = await RegistrationModel.findById(data.registrationId);

        if (!registration) {
            throw new NotFoundError("Registration not found");
        }

        if (registration.status !== RegistrationStatus.DRAFT) {
            throw new BadRequestError("Cannot modify a submitted registration");
        }

        const course = await CourseModel.findById(data.courseId);

        if (!course) {
            throw new NotFoundError("Course not found");
        }

        if (!course.department.equals(registration.department)) {
            throw new BadRequestError("Course does not belong to student's department");
        }
        
        if (course.level > registration.level) {
            throw new BadRequestError("Cannot register for courses above your current level");
        }

        if (course.semester !== registration.semester) {
            throw new BadRequestError("Course semester mismatch");
        }

        const isCarryOver = await this.hasFailedPublishedResultForCourse(
            registration.student,
            course._id,
            registration.semester as SemesterNames
        );

        
        if (!isCarryOver && course.level !== registration.level) {
            throw new BadRequestError(
                "You can only register courses for your current level"
            );
        }

        const alreadyAdded = registration.courses.some(
            c => c.course.toString() === course._id.toString()
        );

        if (alreadyAdded) {
            throw new BadRequestError("Course already added");
        }

        const newTotalCredits =
            registration.totalCredits + course.creditUnits;

        if (newTotalCredits > 24) {
            throw new BadRequestError("Maximum credit unit exceeded (24)");
        }

        if (!isCarryOver) {
            const hasPendingCarryOvers =
                await this.hasUnregisteredCarryOvers(
                    registration.student,
                    registration.semester,
                    registration.courses.map(c => c.course)
                );

            if (hasPendingCarryOvers) {
                throw new BadRequestError(
                    "You must register all carry-over courses before new courses"
                );
            }
        }

        registration.courses.push({
            course: course._id,
            creditUnits: course.creditUnits,
            isCarryOver
        });

        registration.totalCredits = newTotalCredits;

        await registration.save();
        return registration;
    }


    static async hasUnregisteredCarryOvers(
        studentId: mongoose.Types.ObjectId,
        semester: "FIRST" | "SECOND",
        registrationCourseIds: mongoose.Types.ObjectId[]
    ): Promise<boolean> {

        const failedCourses = await ResultModel.find({
            student: studentId,
            semester,
            grade: "F",
            status: "PUBLISHED"
        }).select("course");

        const failedCourseIds = failedCourses.map(r => r.course.toString());

        if (failedCourseIds.length === 0) {
            return false;
        }

        const registeredIds = registrationCourseIds.map(id => id.toString());

        return failedCourseIds.some(id => !registeredIds.includes(id));

    }

    static async submitRegistration(registrationId: string) {
        const registration = await RegistrationModel.findById(registrationId);

        if (!registration) {
            throw new NotFoundError("Registration not found");
        }

        if (registration.status !== RegistrationStatus.DRAFT) {
            throw new BadRequestError("Registration already submitted");
        }

        if (registration.courses.length === 0) {
            throw new BadRequestError("No courses registered");
        }
        
        if (registration.totalCredits < 18 || registration.totalCredits > 24) {
            throw new BadRequestError(
                "Total credit units must be between 18 and 24"
            );
        }

        const hasPendingCarryOvers =
            await this.hasUnregisteredCarryOvers(
                registration.student,
                registration.semester,
                registration.courses.map(c => c.course)
            );

        if (hasPendingCarryOvers) {
            throw new BadRequestError(
                "Unregistered carry-over courses exist"
            );
        }

        registration.status = RegistrationStatus.SUBMITTED;
        await registration.save();

        return registration;
    }

    private static async hasFailedPublishedResultForCourse(
        studentId: mongoose.Types.ObjectId,
        courseId: mongoose.Types.ObjectId,
        semester: SemesterNames): Promise<boolean> {

        
        const carryOver = await ResultModel.findOne({
            student: studentId,
            semester: semester,
            course: courseId,
            grade: "F",
            status: "PUBLISHED",
        });
        return !!carryOver;
    }
}


