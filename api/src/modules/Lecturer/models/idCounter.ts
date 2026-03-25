import mongoose, { Schema, Document } from "mongoose";

export interface IIdCounter extends Document {
  year: number;
  currentSequence: number;
}

const IdCounterSchema = new Schema<IIdCounter>(
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


IdCounterSchema.index(
  { year: 1 },
  { unique: true }
);


export const IdCounterModel = mongoose.model<IIdCounter>(
  "IdCounter",
  IdCounterSchema
);