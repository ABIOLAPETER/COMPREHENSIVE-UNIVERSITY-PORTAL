import { Response, Request, NextFunction } from "express";
import { createLecturerDto, updateLecturerDto } from "../dtos/lecturer.dtos";
import { LecturerService } from "../services/lecturer.services";
import { getLecturerIdFromRequest } from "../../../shared/utils/getIds";


export class LecturerController {
    static async createlecturer(
        req: Request<{}, {}, createLecturerDto>,
        res: Response,
        next: NextFunction
    ){
        try {
            const lecturer = await LecturerService.createLecturer(req.body)

        return res.status(201).json({
            success: true,
            message: "lecturer created successfully",
            data: lecturer
        })
        } catch (error) {
            next(error)
        }      
    }
    static async getCourses(
        req: Request,
        res: Response,
        next: NextFunction
    ){
        try {
            const lecturerId = await getLecturerIdFromRequest(req)

            const result = await LecturerService.viewAssignedCourses(lecturerId)

        return res.status(200).json({
            success: true,
            message: "courses fetched successfully",
            data: result
        })
        } catch (error) {
            next(error)
        }      
    }
    static async getStudents(
        req: Request,
        res: Response,
        next: NextFunction
    ){
        try {
            const lecturerId = await getLecturerIdFromRequest(req)

            const result = await LecturerService.getRegisteredStudentsForMyCourses(lecturerId)

        return res.status(200).json({
            success: true,
            message: "students fetched successfully",
            data: result
        })
        } catch (error) {
            next(error)
        }      
    }
    static async getProfile(
        req: Request,
        res: Response,
        next: NextFunction
    ){
        try {
            const lecturerId = await getLecturerIdFromRequest(req)

            const result = await LecturerService.viewProfile(lecturerId)

        return res.status(200).json({
            success: true,
            message: "profile fetched successfully",
            data: result
        })
        } catch (error) {
            next(error)
        }      
    }
    static async updateProfile(
        req: Request<{}, {}, updateLecturerDto>,
        res: Response,
        next: NextFunction
    ){
        try {
            const lecturerId = await getLecturerIdFromRequest(req)

            const result = await LecturerService.updateProfile(req.body, lecturerId)

        return res.status(200).json({
            success: true,
            message: "profile updatedsuccessfully",
            data: result
        })
        } catch (error) {
            next(error)
        }      
    }
}