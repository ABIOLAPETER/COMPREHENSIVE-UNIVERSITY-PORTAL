import mongoose, { Document, Schema } from "mongoose";

export enum RegistrationStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

const RegisteredCourseSchema = new Schema(
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

const RegistrationSchema = new Schema(
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
    },
    {
        timestamps: true,
    }
);


RegistrationSchema.index(
    { student: 1, session: 1, semester: 1 },
    { unique: true }
);

export const RegistrationModel = mongoose.model(
    "Registration",
    RegistrationSchema
);