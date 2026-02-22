import { Schema, model, Types } from "mongoose";

export interface IStudentCGPA {
  student: Types.ObjectId;
  totalCredits: number;
  totalGradePoints: number;
  cgpa: number;
  level: number;
}

const StudentCGPASchema = new Schema<IStudentCGPA>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    totalCredits: { type: Number, required: true },
    totalGradePoints: { type: Number, required: true },
    cgpa: { type: Number, required: true },

    level: { type: Number, required: true }
  },
  { timestamps: true }
);

StudentCGPASchema.index(
  { student: 1, session: 1 },
  { unique: true }
);

export const StudentCGPAModel = model<IStudentCGPA>(
  "StudentCGPA",
  StudentCGPASchema
);