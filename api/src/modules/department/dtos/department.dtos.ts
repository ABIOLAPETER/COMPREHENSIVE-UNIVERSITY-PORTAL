import { IDepartment } from "../models/department.model";

export type CreateDepartmentDto = Omit<IDepartment, "_id">

export type UpdateDepartmentDto = Partial<Pick<IDepartment, "name" | "code">>