import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  name: string;           // "2024/2025"
  isActive: boolean;
  startYear: number;
  endYear: number;
}

const SessionSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SessionModel = mongoose.model<ISession>("Session", SessionSchema);
