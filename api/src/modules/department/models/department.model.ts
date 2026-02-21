import mongoose, { Schema } from "mongoose";

export interface IDepartment {
  name: string;
  code: string;
  faculty: mongoose.Types.ObjectId;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
  },
  { timestamps: true }
);

DepartmentSchema.index(
  { name: 1, faculty: 1 },
  { unique: true }
);

export const DepartmentModel = mongoose.model<IDepartment>(
  "Department",
  DepartmentSchema
);