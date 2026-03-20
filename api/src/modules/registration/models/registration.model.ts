import mongoose, { Document, Schema, Types } from "mongoose";

export enum RegistrationStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface IRegisteredCourse {
  course: Types.ObjectId;
  creditUnits: number;
  isCarryOver: boolean;
}

export interface IRegistration extends Document {
  student: Types.ObjectId;
  department: Types.ObjectId;
  session: string;
  semester: string;
  level: number;
  status: RegistrationStatus;
  totalCredits: number;
  courses: IRegisteredCourse[];
  feesPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RegisteredCourseSchema = new Schema<IRegisteredCourse>(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    creditUnits: {
      type: Number,
      required: true,
    },
    isCarryOver: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const RegistrationSchema = new Schema<IRegistration>(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    session: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      enum: ["FIRST", "SECOND"],
      required: true,
    },
    level: {
      type: Number,
      enum: [100, 200, 300, 400, 500],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.DRAFT,
    },
    totalCredits: {
      type: Number,
      default: 0,
    },
    courses: {
      type: [RegisteredCourseSchema],
      default: [],
    },
    feesPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

RegistrationSchema.index({ student: 1, session: 1, semester: 1 }, { unique: true });
RegistrationSchema.index({ student: 1, status: 1 });
RegistrationSchema.index({ status: 1 });
RegistrationSchema.index({ department: 1, session: 1, semester: 1 });

export const RegistrationModel = mongoose.model<IRegistration>(
  "Registration",
  RegistrationSchema
);