import { validateDepartmentCreation } from "../../../shared/utils/validate";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { redisClient } from "../../../shared/utils/redis";
import { DepartmentModel, IDepartment } from "../models/department.model";
import { CreateDepartmentDto, UpdateDepartmentDto } from "../dtos/department.dtos";
import { FacultyModel } from "../../faculty/models/faculty.model";
export class DepartmentService {


    static async createDepartment(data: CreateDepartmentDto): Promise<IDepartment> {

        const { name, code, faculty } = data;

        if (!name || !code || !faculty) {
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
            faculty,
        });
        await redisClient.del(`departments:all`)
        await redisClient.del(`departments:faculty:${faculty}`)

        return department;
    }

    static async getAllDepartments(): Promise<IDepartment[ ]> {
        const cacheKey = `departments:all`
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const departments = await DepartmentModel.find().sort({ name: 1 }).populate("faculty", "name code");
        await redisClient.setex(cacheKey, 21600, JSON.stringify(departments))
        return departments;
    }

    static async getDepartmentById(departmentId: string): Promise<IDepartment> {
        const cacheKey = `departments:${departmentId}`
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
        const department = await DepartmentModel.findById(departmentId).populate("faculty", "name code");
        if (!department) {
            throw new NotFoundError("Department not found");
        }
        await redisClient.setex(cacheKey, 21600, JSON.stringify(department))
        return department;
    }


    static async updateDepartment(departmentId: string, data: UpdateDepartmentDto): Promise<IDepartment> {
        const department = await DepartmentModel.findByIdAndUpdate(
            departmentId,
            data,
            { new: true }
        ).populate("faculty", "name code");
        if (!department) {
            throw new NotFoundError("Department not found");
        }
        await redisClient.del(`departments:all`)
        const keys = await redisClient.keys(`departments:faculty:*`);
        if (keys.length > 0) {
            await Promise.all(keys.map(key => redisClient.del(key)));
        }
        return department;
    }

    static async deleteDepartment(departmentId: string): Promise<{ message: String }> {
        const department = await DepartmentModel.findByIdAndDelete(departmentId);
        if (!department) {
            throw new NotFoundError("Department not found");
        }
        await redisClient.del(`departments:all`)
        const keys = await redisClient.keys(`departments:faculty:*`);
        if (keys.length > 0) {
            await Promise.all(keys.map(key => redisClient.del(key)));
        }
       return { message: "Department deleted successfully" };
    }

    static async getDepartmentsByFaculty(facultyId: string): Promise<IDepartment[ ]> {
        const cacheKey = `departments:faculty:${facultyId}`
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
        const facultyExists = await FacultyModel.findById(facultyId)
        if(!facultyExists){
            throw new NotFoundError("Faculty does not exist")
        }
        const departments = await DepartmentModel.find({ faculty: facultyId }).sort({ name: 1 });
        await redisClient.setex(cacheKey, 21600, JSON.stringify(departments))
        return departments;
    }

}