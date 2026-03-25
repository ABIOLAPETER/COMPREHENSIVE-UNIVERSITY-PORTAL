import mongoose from "mongoose";

export interface ILecturer {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    department?: mongoose.Types.ObjectId;
    idNumber?: string;
    user: mongoose.Types.ObjectId;
    status?: LecturerStatus;
    faculty: mongoose.Types.ObjectId;
}


export enum LecturerStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
}

const LecturerSchema = new mongoose.Schema<ILecturer>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    idNumber: { type: String, unique:true, sparse: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: { type: String, enum: Object.values(LecturerStatus), default: LecturerStatus.ACTIVE },
    
}, {
    timestamps: true,
});

LecturerSchema.index({ department: 1 });
LecturerSchema.index({ status: 1 });
LecturerSchema.index({ faculty: 1 });

const Lecturer = mongoose.model<ILecturer>("Lecturer", LecturerSchema);

export default Lecturer;