
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { validateCourseCreation, validateFacultyCreation } from "../../../shared/utils/validate";

import { FacultyModel } from "../models/faculty.model";

export class FacultyService {
    // Implement faculty-related business logic here

    static async createFaculty(data: {  
        name: string;   
        code: string;
    }) {
        
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
        return faculty;
    }


    static async getAllFaculties() {
        const faculties = await FacultyModel.find().sort({ name: 1 });
        return faculties;
    }


    static async getFacultyById(facultyId: string) {
        const faculty = await FacultyModel.findById(facultyId);
        if (!faculty) {
            throw new NotFoundError("Faculty not found");
        }
        return faculty;
    }

    static async updateFaculty(facultyId: string, data: { name?: string; code?: string }) {
        const faculty = await FacultyModel.findByIdAndUpdate(facultyId, data, { new: true });
        if (!faculty) {
            throw new NotFoundError("Faculty not found");
        }
        return faculty;
    }


    static async deleteFaculty(facultyId: string) {
        const faculty = await FacultyModel.findByIdAndDelete(facultyId);
        if (!faculty) {
            throw new NotFoundError("Faculty not found");
        }
        return faculty;
    }

    
}