import mongoose, { Schema } from "mongoose";

export interface IFaculty {
  name: string;
  code: string;
}

const FacultySchema = new Schema<IFaculty>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    }  
},{ timestamps: true });

export const FacultyModel = mongoose.model<IFaculty>(
  "Faculty",
  FacultySchema
);
