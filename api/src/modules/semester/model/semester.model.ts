import mongoose from "mongoose";

export enum SemesterNames {
  FIRST = "FIRST",
  SECOND = "SECOND"
}

export interface ISemester extends mongoose.Document {
  name: SemesterNames; // "FIRST", "SECOND"
  session: mongoose.Types.ObjectId;
  isActive: boolean;
  isLocked: boolean;
}
const SemesterSchema = new mongoose.Schema<ISemester>(
  {
    name: { type: String, required: true, enum: Object.values(SemesterNames) }, // "FIRST", "SECOND"
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    isActive: { type: Boolean, default: false },
    isLocked: {
      type: Boolean, default: false
    }
  },
  { timestamps: true }
);  

SemesterSchema.index({ name: 1, session: 1 }, { unique: true });

export const SemesterModel = mongoose.model<ISemester>("Semester", SemesterSchema);