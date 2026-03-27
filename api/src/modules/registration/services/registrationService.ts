import { IRegistration, RegistrationModel, RegistrationStatus } from "../models/registration.model";
import Student from "../../student/models/student.model";
import { CourseModel } from "../../course/models/course.model";
import { NotFoundError, ConflictError, BadRequestError } from "../../../shared/errors/AppError";
import mongoose from "mongoose";
import { ResultModel } from "../../result/models/result.model"
import { CreateDraftRegistrationDto, AddCourseDto, RemoveCourseDto } from "../dtos/registration.dtos";
import { SemesterService } from "../../semester/services/semester.services";
import { SessionService } from "../../session/services/session.services";
import { SemesterNames } from "../../semester/model/semester.model";
import { SemesterModel } from "../../semester/model/semester.model";
import { redisClient } from "../../../shared/utils/redis";

export class RegistrationService {


    static async createDraftRegistration(data: CreateDraftRegistrationDto): Promise<IRegistration> {

        const student = await Student.findById(data.studentId);
        if (!student) {
            throw new NotFoundError("Student not found");
        }

        const activeSemester = await SemesterService.getActiveSemester();
        if (!activeSemester) {
            throw new NotFoundError("No active semester found");
        }

        if (activeSemester.isLocked) {
            throw new BadRequestError("semester is locked for registration")
        }

        const activeSession = await SessionService.getActiveSession();
        if (!activeSession) {
            throw new NotFoundError("No active session found");
        }

        const existingRegistration = await RegistrationModel.findOne({ student: data.studentId, semester: activeSemester.name, session: activeSession.name });

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

    static async addCourseToRegistration(data: AddCourseDto): Promise<IRegistration> {
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

        const semester = await SemesterModel.findOne({ name: registration.semester })        
        if (!semester) {
            throw new NotFoundError("semester does not exist")
        }
        if (course.semester !== registration.semester) {
            throw new BadRequestError("Course semester mismatch");
        }
        const isCarryOver = await this.hasFailedPublishedResultForCourse(
            registration.student,
            course._id,
            semester.name
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


    static async submitRegistration(registrationId: string): Promise<IRegistration> {
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
        if (!registration.feesPaid) {
            throw new BadRequestError("School fees must be paid before submitting registration");
        }
        const semester = await SemesterModel.findById(registration.semester)
        if (!semester) {
            throw new NotFoundError("semester does not exist")
        }

        const hasPendingCarryOvers =
            await this.hasUnregisteredCarryOvers(
                registration.student,
                semester.name,
                registration.courses.map(c => c.course)
            );

        if (hasPendingCarryOvers) {
            throw new BadRequestError(
                "Unregistered carry-over courses exist"
            );
        }

        registration.status = RegistrationStatus.SUBMITTED;
        await registration.save();
        const key1 = await redisClient.keys(`registrations:all:*`);
        const key2 = await redisClient.keys(`registrations:draft:*`);
        if (key1.length > 0) await Promise.all(key1.map(key => redisClient.del(key)));
        if (key2.length > 0) await Promise.all(key2.map(key => redisClient.del(key)));

        return registration;
    }

    // ── Replace these two private/static methods in RegistrationService ──────────

    private static async hasFailedPublishedResultForCourse(
        studentId: mongoose.Types.ObjectId,
        courseId: mongoose.Types.ObjectId,
        semesterName: SemesterNames
    ): Promise<boolean> {

        // FIX: Result.semester is an ObjectId ref — resolve the name to an _id first
        const semesterDoc = await SemesterModel.findOne({ name: semesterName, isActive: true });
        if (!semesterDoc) return false;

        const carryOver = await ResultModel.findOne({
            student: studentId,
            semester: semesterDoc._id,   // ← ObjectId, not the string "FIRST"
            course: courseId,
            grade: "F",
            status: "PUBLISHED",
        });

        return !!carryOver;
    }

    static async hasUnregisteredCarryOvers(
        studentId: mongoose.Types.ObjectId,
        semesterName: "FIRST" | "SECOND",
        registrationCourseIds: mongoose.Types.ObjectId[]
    ): Promise<boolean> {

       
        const semesterDoc = await SemesterModel.findOne({ name: semesterName, isActive: true });
        if (!semesterDoc) return false;

        const failedCourses = await ResultModel.find({
            student: studentId,
            semester: semesterDoc._id,   // ← ObjectId, not the string "FIRST"
            grade: "F",
            status: "PUBLISHED",
        }).select("course");

        if (!failedCourses.length) return false;

        const failedCourseIds = failedCourses.map(r => r.course.toString());
        const registeredIds = registrationCourseIds.map(id => id.toString());

        return failedCourseIds.some(id => !registeredIds.includes(id));
    }


    static async getDraftRegistration(studentId: string): Promise<IRegistration> {


        const activeSemester = await SemesterService.getActiveSemester();
        if (!activeSemester) throw new NotFoundError("No active semester found");
        // getDraftRegistration
        const cacheKey = `registrations:draft:${studentId}:${activeSemester._id}`;
        const cached = await redisClient.get(cacheKey)
        if (cached) return JSON.parse(cached)
        const student = await Student.findById(studentId);
        if (!student) {
            throw new NotFoundError("Student not found");
        }

        const activeSession = await SessionService.getActiveSession();
        if (!activeSession) throw new NotFoundError("No active session found");

        const registration = await RegistrationModel.findOne({
            student: studentId,
            semester: activeSemester.name,
            session: activeSession.name,
        }).populate("courses.course");

        if (!registration) {
            throw new NotFoundError("No registration found for this student this semester");
        }
        await redisClient.setex(cacheKey, 21600, JSON.stringify(registration))
        return registration;
    }

    static async removeCourseFromRegistration(data: RemoveCourseDto): Promise<IRegistration> {
        const registration = await RegistrationModel.findById(data.registrationId);

        if (!registration) {
            throw new NotFoundError("Registration not found");
        }

        if (registration.status !== RegistrationStatus.DRAFT) {
            throw new BadRequestError("Cannot modify a submitted registration");
        }

        const courseEntry = registration.courses.find(
            c => c.course.toString() === data.courseId
        );

        // ✅ Only subtract if the course was actually in the registration

        if (!courseEntry) {
            throw new NotFoundError("Course not found in registration");
        }

        registration.courses = registration.courses.filter(
            c => c.course.toString() !== data.courseId
        );

        registration.totalCredits = Math.max(0,
            registration.totalCredits - (courseEntry.creditUnits ?? 0)
        );

        await registration.save();
        return registration;
    }


    static async approveRegistration(registrationId: string): Promise<IRegistration> {
        const session = await mongoose.startSession()
        session.startTransaction()
        try {
            const registration = await RegistrationModel.findById(registrationId)

            if (!registration) {
                throw new NotFoundError("could not find registration")
            }

            if (registration.status !== RegistrationStatus.SUBMITTED) {
                throw new BadRequestError("Only submitted registrations can be approved")
            }

            registration.status = RegistrationStatus.APPROVED
            // When approved — create empty result placeholders
            const resultDocs = registration.courses.map(c => ({
                student: registration.student,
                course: c.course,
                session: registration.session,
                semester: registration.semester,
                score: null,
                grade: null,
                status: "PENDING"
            }));

            await ResultModel.insertMany(resultDocs, { session });

            await registration.save({ session })
            await session.commitTransaction()
            const key1 = await redisClient.keys(`registrations:all:*`);
            const key2 = await redisClient.keys(`registrations:draft:*`);
            if (key1.length > 0) await Promise.all(key1.map(key => redisClient.del(key)));
            if (key2.length > 0) await Promise.all(key2.map(key => redisClient.del(key)));

            return registration
        } catch (error) {
            await session.abortTransaction()
            throw error
        }
        finally {
            await session.endSession()
        }

    }

    static async getAllRegistrations(status?: RegistrationStatus | "ALL"): Promise<IRegistration[]> {
        const cacheKey = `registrations:all:${status || "ALL"}`;
        const cached = await redisClient.get(cacheKey)
        if (cached) return JSON.parse(cached)
        const filter = status && status !== "ALL" ? { status } : {};
        const registrations = await RegistrationModel.find(filter)
            .populate("student", "firstName lastName matricNumber level department")
            .populate("department", "name")
            .populate("courses.course", "code title type creditUnits")
            .sort({ createdAt: -1 });
        await redisClient.setex(cacheKey, 21600, JSON.stringify(registrations))
        return registrations;
    }

    static async rejectRegistration(registrationId: string): Promise<IRegistration> {
        const registration = await RegistrationModel.findById(registrationId)

        if (!registration) {
            throw new NotFoundError("could not find registration")
        }

        if (registration.status !== RegistrationStatus.SUBMITTED) {
            throw new BadRequestError("Only submitted registrations can be rejected")
        }

        registration.status = RegistrationStatus.REJECTED

        await registration.save()
        const key1 = await redisClient.keys(`registrations:all:*`);
        const key2 = await redisClient.keys(`registrations:draft:*`);
        if (key1.length > 0) await Promise.all(key1.map(key => redisClient.del(key)));
        if (key2.length > 0) await Promise.all(key2.map(key => redisClient.del(key)));

        return registration
    }
}


