import { IFaculty } from "../models/faculty.model"

export type CreateFacultyDto = Omit<IFaculty, "_id">

export type UpdateFacultyDto = Partial<Pick<IFaculty, "name" | "code">>