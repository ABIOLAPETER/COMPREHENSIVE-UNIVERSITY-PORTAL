import { validateDepartmentCreation } from "../../../shared/utils/validate";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";

import { DepartmentModel } from "../models/department.model";

export class DepartmentService {
  // Implement department-related business logic here

  static async createDepartment(data: {
    name: string;
    code: string;
    facultyId: string;
  }) {
    // Validate input data

    const { name, code, facultyId } = data;
    if (!name || !code || !facultyId) {
      throw new ValidationError("Missing required fields");
    }

    validateDepartmentCreation(data);

    const existingDepartment = await DepartmentModel.findOne({ $or: [{ name }, { code }] });
    if (existingDepartment) {
      throw new ConflictError("Department with this name or code already exists");
    }
    const department = await DepartmentModel.create({
      name,
      code,
        faculty: facultyId,
    });
    return department;
  }

    static async getAllDepartments() {
        const departments = await DepartmentModel.find().sort({ name: 1 }).populate("faculty", "name code");
        return departments;
    }

    static async getDepartmentById(departmentId: string) {
        const department = await DepartmentModel.findById(departmentId).populate("faculty", "name code");
        if (!department) {
            throw new NotFoundError("Department not found");
        }
        return department;
    }

    static async updateDepartment(departmentId: string, data: { name?: string; code?: string;}) {
        const department = await DepartmentModel.findByIdAndUpdate(
            departmentId,
            data,
            { new: true }
        ).populate("faculty", "name code");
        if (!department) {
            throw new NotFoundError("Department not found");
        }           
        return department;
    }

    static async deleteDepartment(departmentId: string) {
        const department = await DepartmentModel.findByIdAndDelete(departmentId);
        if (!department) {
            throw new NotFoundError("Department not found");
        }
        return department;
    }

    static async getDepartmentsByFaculty(facultyId: string) {
        const departments = await DepartmentModel.find({ faculty: facultyId }).sort({ name: 1 });
        return departments;
    }
    
}