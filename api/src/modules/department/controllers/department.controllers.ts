import { NextFunction, Request, Response } from "express";
import { DepartmentService } from "../services/department.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "../dtos/department.dtos";


export class DepartmentController {
    static async createDepartment(
        req: Request<{}, {}, CreateDepartmentDto>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const department = await DepartmentService.createDepartment(req.body);
            res.status(201).json({
                success: true,
                message: "Department created successfully",
                data: department
            });
        } catch (error) {
            next(error)
        }
    }
    static async getAllDepartments(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const departments = await DepartmentService.getAllDepartments();
            res.status(200).json({
                success: true,
                message: "Departments retrieved successfully",
                data: departments,
            });
        } catch (error) {
            next(error)
        }

    }

    static async getDepartmentById(
        req: Request<{ departmentId: string }>,
        res: Response,
        next: NextFunction) {
        try {
            const { departmentId } = req.params;
            const department = await DepartmentService.getDepartmentById(departmentId);
            res.status(200).json({
                success: true,
                message: "Department retrieved successfully",
                data: department,
            });
        }
        catch (error) {
            next(error)
        }
    }

    static async updateDepartment(
        req: Request<{ departmentId: string }, {}, UpdateDepartmentDto>,
        res: Response,
        next: NextFunction) {
        try {
            const { departmentId } = req.params;
            const department = await DepartmentService.updateDepartment(departmentId, req.body);
            res.status(200).json({
                success: true,
                message: "Department updated successfully",
                data: department,
            });
        } catch (error) {
            next(error)

        }
    }

    static async deleteDepartment(
        req: Request<{ departmentId: string }>,
        res: Response, 
        next: NextFunction) {
        try {
            const { departmentId } = req.params;
            await DepartmentService.deleteDepartment(departmentId);
            res.status(200).json({
                success: true,
                message: "Department deleted successfully",
            });
        } catch (error) {
            next(error)
        }
    }

    static async getDepartmentsByFaculty(
        req: Request<{ facultyId: string }>,
        res: Response, 
        next: NextFunction
    ) {
        try {
            const { facultyId } = req.params;
            const departments = await DepartmentService.getDepartmentsByFaculty(facultyId);
            res.status(200).json({
                success: true,
                message: "Departments retrieved successfully",
                data: departments,
            });
        }
        catch (error) {
            next(error)
        }
    }
}

