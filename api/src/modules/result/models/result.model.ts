import mongoose, { Document, Schema } from "mongoose";

export interface IResult extends Document {
    student: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    department: mongoose.Types.ObjectId;

    session: string;         
    semester: Semester;
    level: number;

    score: number;           
    grade: Grade;
    gradePoint: number;       // GPA contribution
    creditUnits: number;

    isPassed: boolean;
    isCarryOver: boolean;

    status: ResultStatus;
}

export enum Semester {
    FIRST = "FIRST",
    SECOND = "SECOND",
}

export enum ResultStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
}

export enum Grade {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    E = "E",
    F = "F",
}
const ResultSchema = new Schema<IResult>(
{
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },

    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
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
        enum: Object.values(Semester),
        required: true,
    },

    level: {
        type: Number,
        enum: [100, 200, 300, 400, 500],
        required: true,
    },

    score: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
    },

    grade: {
        type: String,
        enum: Object.values(Grade),
        required: true,
    },

    gradePoint: {
        type: Number,
        required: true,
    },

    creditUnits: {
        type: Number,
        required: true,
    },

    isPassed: {
        type: Boolean,
        required: true,
    },

    isCarryOver: {
        type: Boolean,
        default: false,
    },

    status: {
        type: String,
        enum: Object.values(ResultStatus),
        default: ResultStatus.DRAFT,
    },
},
{
    timestamps: true,
});

ResultSchema.index(
    { student: 1, course: 1, session: 1 },
    { unique: true }
);

ResultSchema.index({ student: 1, semester: 1, isPassed: 1 });


export const ResultModel =  mongoose.model<IResult>("Result", ResultSchema)