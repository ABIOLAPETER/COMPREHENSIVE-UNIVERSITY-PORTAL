import { NextFunction, Request, Response } from "express";
import { AdminService } from "./admin.service";

export class AdminController{

// GET   /admin/stats              → getDashboardStats
// GET   /admin/students           → getAllStudents
// GET   /admin/lecturers          → getAllLecturers
// GET   /admin/courses            → getAllCourses
// PATCH /admin/reset-password/:userId → resetUserPassword
    static async getDashboardStats(req: Request, res: Response, next: NextFunction){
        try {
            const stats = await AdminService.getDashboardStats()
            
            return res.status(200).json({
                success: true,
                message: "dashboard stats fetched successfully",
                data: stats
            })
        } catch (error) {
            next(error)
        }
    }
    static async getAllStudents(req: Request, res: Response, next: NextFunction){
        try {
            const students = await AdminService.getAllStudents()
            
            return res.status(200).json({
                success: true,
                message: "Students fetched successfully",
                data: students
            })
        } catch (error) {
            next(error)
        }
    }
    static async getAllLecturers(req: Request, res: Response, next: NextFunction){
        try {
            const lecturers = await AdminService.getAllLecturers()
            
            return res.status(200).json({
                success: true,
                message: "lecturers fetched successfully",
                data: lecturers
            })
        } catch (error) {
            next(error)
        }
    }
    static async getAllCourses(req: Request, res: Response, next: NextFunction){
        try {
            const courses = await AdminService.getAllCourses()
            
            return res.status(200).json({
                success: true,
                message: "courses fetched successfully",
                data: courses
            })
        } catch (error) {
            next(error)
        }
    }

    static async resetUserPassword(req: Request<{userId: string}>, res: Response, next: NextFunction){
        try {
            await AdminService.resetUserPassword(req.params.userId)
            
            return res.status(200).json({
                success: true,
                message: "password reset successfully",
            })
        } catch (error) {
            next(error)
        }
    }

   

}