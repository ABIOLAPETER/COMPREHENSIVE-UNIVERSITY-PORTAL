import mongoose, { Schema, Document } from "mongoose";

export interface IMatricCounter extends Document {
  facultyCode: string;
  departmentCode: string;
  year: number;
  currentSequence: number;
}

const MatricCounterSchema = new Schema<IMatricCounter>(
  {
    facultyCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    departmentCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    currentSequence: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Prevents duplicate counters
 * One counter per faculty + department + year
 */
MatricCounterSchema.index(
  { facultyCode: 1, departmentCode: 1, year: 1 },
  { unique: true }
);


export const MatricCounterModel = mongoose.model<IMatricCounter>(
  "MatricCounter",
  MatricCounterSchema
);