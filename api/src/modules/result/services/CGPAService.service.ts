import { Types } from "mongoose";
import { StudentGPAModel } from "../models/GPA.model";


import { BadRequestError, NotFoundError } from "../../../shared/errors/AppError";
import { IStudentCGPA, StudentCGPAModel } from "../models/CGPA.model";
import Student from "../../student/models/student.model";

export class CGPAService {

    static async calculateAndUpsertCGPA(studentId: string) {

        const student = await Student.findById(studentId);
        if (!student) {
            throw new NotFoundError("Student not found");
        }

        const gpas = await StudentGPAModel.find({ student: studentId });

        if (gpas.length === 0) {
            return null;
        }

        const totalCredits = gpas.reduce(
            (sum, gpa) => sum + gpa.totalCredits,
            0
        );

        const totalGradePoints = gpas.reduce(
            (sum, gpa) => sum + gpa.totalGradePoints,
            0
        );

        if (totalCredits === 0) {
            throw new BadRequestError("Total credit units cannot be zero");
        }

        const cgpa = parseFloat((totalGradePoints / totalCredits).toFixed(2));
        
        return StudentCGPAModel.findOneAndUpdate(
            { student: studentId },
            {
                $set: {
                    totalCredits,
                    totalGradePoints,
                    cgpa,
                },
                $setOnInsert: {
                    student: studentId,  // only set on first creation
                    level: student.level,
                }
            },
            { upsert: true, new: true }
        );
    }

    static async getStudentCgpa(studentId: string): Promise<IStudentCGPA> {
        const CGPADetails = await StudentCGPAModel.findOne({ student: studentId })
            .select("totalCredits totalGradePoints level cgpa")
            .populate("student", "firstName lastName matricNumber");

        if (!CGPADetails) {
            throw new NotFoundError("CGPA details not found");
        }

        return CGPADetails;
    }




}