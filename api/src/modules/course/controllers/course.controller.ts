import { Request, Response } from "express";
import { CourseService } from "../services/course.service";


export class CourseController{
    static async createCourse(req: Request, res: Response){
        try {
            const data = req.body

            const course = await CourseService.createCourse(data)

            return res.status(201).json({
                message: "Course created", course
            })
        } catch (error) {
             res.status(400).json({ error: error instanceof Error ? error.message : "could not create course" });
        }
    }

    static async updateCourse(req: Request, res: Response){
        try {
            const {courseId} = req.params
            const data = req.body

            const course = await CourseService.updateCourse(courseId.toString(), data)

            return res.status(201).json({
                message: "Course updated", course
            })
        } catch (error) {
             res.status(400).json({ error: error instanceof Error ? error.message : "could not update course" });
        }
    }

    static async getEligibleCourses(req: Request, res: Response){
        try {
            const {studentId} = req.params

            const courses = await CourseService.listEligibleCoursesForStudent(studentId.toString())

            return res.status(201).json({
                message: "Eligible courses", courses
            })
        } catch (error) {
             res.status(400).json({ error: error instanceof Error ? error.message : "could not get eligible courses" });
        }
    }
}