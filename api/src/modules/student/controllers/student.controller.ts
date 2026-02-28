import { Request, Response } from "express";
import { StudentService } from "../services/student.service"; 
import { Types } from "mongoose";
export class StudentController{
    static async updateStudent(req: Request, res: Response){
        try {
            const {departmentId, admissionType} = req.body
            const {studentId} = req.params
            const student = await StudentService.updateStudent({
                departmentId,
                studentId: studentId.toString(),
                admissionType
            })

            return res.status(201).json({
                message: "student updated", student
            })
        } catch (error) {
             res.status(400).json({ error: error instanceof Error ? error.message : "could not create student" });
        }
    }

    static async getStudentProfile(req: Request, res: Response){
        try {
            const {userId} = req.params

            const studentProfile = await StudentService.getStudentProfile(userId.toString())

            return res.status(201).json({
                message: "Student profile ", studentProfile
            })
        } catch (error) {
             res.status(400).json({ error: error instanceof Error ? error.message : "could not get student profile" });
        }
    }
}