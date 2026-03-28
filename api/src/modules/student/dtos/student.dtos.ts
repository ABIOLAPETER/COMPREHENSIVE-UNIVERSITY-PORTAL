import { AdmissionType } from "../models/student.model";

export type UpdateStudentDto = {
  dateOfBirth: string
  admissionType: AdmissionType;
  level?: number;
}