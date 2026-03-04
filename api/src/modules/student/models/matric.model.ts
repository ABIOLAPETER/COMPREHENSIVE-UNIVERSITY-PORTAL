import mongoose, { Schema, Document } from "mongoose";

export interface IMatricCounter extends Document {
  year: number;
  currentSequence: number;
}

const MatricCounterSchema = new Schema<IMatricCounter>(
  {
    year: {
      type: Number,
      required: true,
      
    },
    currentSequence: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


MatricCounterSchema.index(
  { year: 1 },
  { unique: true }
);


export const MatricCounterModel = mongoose.model<IMatricCounter>(
  "MatricCounter",
  MatricCounterSchema
);