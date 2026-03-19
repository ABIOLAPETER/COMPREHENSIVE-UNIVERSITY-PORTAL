
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { redisClient } from "../../../shared/utils/redis";
import { validateFacultyCreation } from "../../../shared/utils/validate";
import { CreateFacultyDto, UpdateFacultyDto } from "../dtos/faculty.dtos";

import { FacultyModel, IFaculty } from "../models/faculty.model";

export class FacultyService {

    static async createFaculty(data: CreateFacultyDto): Promise<IFaculty> {

        const { name, code } = data;
        if (!name || !code) {
            throw new ValidationError("Missing required fields");
        }
        validateFacultyCreation(data);

        const existingFaculty = await FacultyModel.findOne({ $or: [{ name }, { code }] });
        if (existingFaculty) {
            throw new ConflictError("Faculty with this name or code already exists");
        }
        const faculty = await FacultyModel.create({
            name,
            code,
        });
        await redisClient.del(`faculties:all`)
        return faculty;
    }


    static async getAllFaculties(): Promise<IFaculty[ ]> {
        const cacheKey = `faculties:all`
        const cached = await redisClient.get(cacheKey)
        if (cached) return JSON.parse(cached)
        const faculties = await FacultyModel.find().sort({ name: 1 });
        await redisClient.setex(cacheKey, 21600, JSON.stringify(faculties))
        return faculties;
    }


    static async getFacultyById(facultyId: string): Promise<IFaculty> {
        const cacheKey = `faculties:${facultyId}`
        const cached = await redisClient.get(cacheKey)
        if (cached) return JSON.parse(cached)
        const faculty = await FacultyModel.findById(facultyId);
        if (!faculty) {
            throw new NotFoundError("Faculty not found");
        }
        await redisClient.setex(cacheKey, 21600, JSON.stringify(faculty))

        return faculty;
    }


    static async updateFaculty(facultyId: string, data: UpdateFacultyDto): Promise<IFaculty> {
        const faculty = await FacultyModel.findByIdAndUpdate(facultyId, data, { new: true });
        if (!faculty) {
            throw new NotFoundError("Faculty not found");
        }
        await redisClient.del(`faculties:all`)
        const keys = await redisClient.keys(`faculties:*`)
        if (keys.length > 0) {
            await Promise.all(keys.map(key => redisClient.del(key)));
        }
        return faculty;
    }


    static async deleteFaculty(facultyId: string): Promise<{message: String}> {
        const faculty = await FacultyModel.findByIdAndDelete(facultyId);
        if (!faculty) {
            throw new NotFoundError("Faculty not found");
        }
        await redisClient.del(`faculties:all`)
        const keys = await redisClient.keys(`faculties:*`)
        if (keys.length > 0) {
            await Promise.all(keys.map(key => redisClient.del(key)));
        }
        return {message: "Faculty deleted Successfully"};
    }

}