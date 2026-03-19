import mongoose, { Document, Schema } from "mongoose";

export interface ICourse extends Document {
    title: string;
    code: string;
    creditUnits: number;
    department: mongoose.Types.ObjectId;
    semester: Semester;
    level: number;
    type: CourseType;
    isActive: boolean;
}

export enum Semester {
    FIRST = "FIRST",
    SECOND = "SECOND",
}

export enum CourseType {
    CORE = "CORE",
    ELECTIVE = "ELECTIVE",
}   

const CourseSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true },
    creditUnits: { type: Number, required: true, min: 1 },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    semester: { type: String, enum: Object.values(Semester), required: true },
    level: { type: Number, enum: [100, 200, 300, 400, 500], required: true },
    type: { type: String, enum: Object.values(CourseType), required: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
}); 



CourseSchema.index({ department: 1 });
CourseSchema.index({ department: 1, level: 1, semester: 1 });
CourseSchema.index({ code: 1, department: 1 }, { unique: true });
CourseSchema.index({ isActive: 1 });

export const CourseModel = mongoose.model<ICourse>("Course", CourseSchema);