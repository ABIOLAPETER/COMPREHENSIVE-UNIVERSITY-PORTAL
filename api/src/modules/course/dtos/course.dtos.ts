import { ICourse } from "../models/course.model"; 

export type CreateCourseDto = Omit<ICourse, "_id" | "level" | "semester" | "isActive" | "createdAt">;

export type UpdateCourseDto = Partial<Pick<ICourse, "title" | "creditUnits" | "type" | "isActive">>;