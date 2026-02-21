


import { Request, Response } from "express";
import { DepartmentService } from "../services/department.services";
import { logger } from "../../../shared/utils/logger";
import { AppError } from "../../../shared/errors/AppError";


export class DepartmentController {
    static async createDepartment(req: Request, res: Response) {
        try {
            const { name, code, facultyId } = req.body;
            const department = await DepartmentService.createDepartment({
                name,
                code,
                facultyId,
            });
            logger.info(`Department ${name} created successfully`);
            res.status(201).json({
                message: "Department created successfully",
                department,
            });
        } catch (error) {
            logger.error("Create department error", error);
            res.status(400).json(
                { error: error instanceof AppError ? error.message : "Create department failed" }
            );
        }
    }
    static async getAllDepartments(req: Request, res: Response) {
        try {
            const departments = await DepartmentService.getAllDepartments();
            res.status(200).json({
                message: "Departments retrieved successfully",
                departments,
            });
        } catch (error) {
            logger.error("Get all departments error", error);
            res.status(500).json({ error: "Internal server error" });
        }

    }

    static async getDepartmentById(req: Request, res: Response) {
        try {
            const { departmentId } = req.params;
            const department = await DepartmentService.getDepartmentById(departmentId.toString());
            res.status(200).json({
                message: "Department retrieved successfully",
                department,
            });
        }
        catch (error) {
            logger.error("Get department by ID error", error);
            res.status(404).json(
                { error: error instanceof AppError ? error.message : "Department not found" }
            );
        }
    }

    static async updateDepartment(req: Request, res: Response) {
        try {
            const { departmentId } = req.params;
            const { name, code } = req.body;
            const department = await DepartmentService.updateDepartment(departmentId.toString(), {
                name,
                code,
            });
            logger.info(`Department ${departmentId} updated successfully`);
            res.status(200).json({
                message: "Department updated successfully",
                department,
            });
        } catch (error) {
            logger.error("Update department error", error);
            res.status(400).json(
                { error: error instanceof AppError ? error.message : "Update department failed" }
            );
        }
    }

    static async deleteDepartment(req: Request, res: Response) {
        try {
            const { departmentId } = req.params;
            await DepartmentService.deleteDepartment(departmentId.toString());
            logger.info(`Department ${departmentId} deleted successfully`);
            res.status(200).json({
                message: "Department deleted successfully",
            });
        } catch (error) {
            logger.error("Delete department error", error);
            res.status(400).json(
                { error: error instanceof AppError ? error.message : "Delete department failed" }
            );
        }
    }

    static async getDepartmentsByFaculty(req: Request, res: Response) {
        try {
            const { facultyId } = req.params;
            const departments = await DepartmentService.getDepartmentsByFaculty(facultyId.toString());
            res.status(200).json({
                message: "Departments retrieved successfully",
                departments,
            });
        }
        catch (error) {
            logger.error("Get departments by faculty error", error);
            res.status(400).json(
                { error: error instanceof AppError ? error.message : "Get departments by faculty failed" }
            );
        }
    }

}

