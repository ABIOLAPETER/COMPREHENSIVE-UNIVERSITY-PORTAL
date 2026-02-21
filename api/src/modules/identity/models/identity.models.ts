import { Schema, model, Types } from "mongoose";

export enum Role {
  STUDENT = "STUDENT",
  ADMIN = "ADMIN",
  LECTURER = "LECTURER",
}

export interface User {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  isEmailVerified: boolean;
  isActive: boolean;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.STUDENT,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<User>("User", userSchema);
