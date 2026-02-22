import { Schema, model, Types } from "mongoose";

export interface IStudentGPA {
  student: Types.ObjectId;
  session: Types.ObjectId;
  semester: Types.ObjectId;

  totalCredits: number;
  totalGradePoints: number;
  gpa: number;

  level: number;
}

const StudentGPASchema = new Schema<IStudentGPA>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true },

    totalCredits: { type: Number, required: true },
    totalGradePoints: { type: Number, required: true },
    gpa: { type: Number, required: true },

    level: { type: Number, required: true }
  },
  { timestamps: true }
);

StudentGPASchema.index(
  { student: 1, session: 1, semester: 1 },
  { unique: true }
);

export const StudentGPAModel = model<IStudentGPA>(
  "StudentGPA",
  StudentGPASchema
);