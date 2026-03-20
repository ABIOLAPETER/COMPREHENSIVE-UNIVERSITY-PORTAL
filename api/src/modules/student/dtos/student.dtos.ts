import { AdmissionType } from "../models/student.model";

export type UpdateStudentDto = {
  departmentId: string;
  admissionType: AdmissionType;
  level?: number;
}