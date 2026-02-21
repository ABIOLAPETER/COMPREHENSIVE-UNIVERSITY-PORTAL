import mongoose from "mongoose";

export interface IStudent {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    department: mongoose.Types.ObjectId;
    matricNumber: string;
    user: mongoose.Types.ObjectId;
    level?: number;
    status?: StudentStatus;
    admissionType?: AdmissionType;
    totalPassedCredits?: number;
    CGPA?: number;
    admissionYear: Date
    faculty: mongoose.Types.ObjectId;
}

export enum AdmissionType {
    UTME = "UTME",
    DIRECT_ENTRY = "DIRECT_ENTRY",
    TRANSFER = "TRANSFER",
}


export enum StudentStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
}

const studentSchema = new mongoose.Schema<IStudent>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date},
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
    matricNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true ,unique: true},
    status: { type: String, enum: Object.values(StudentStatus), default: StudentStatus.ACTIVE },
    level: { type: Number, enum: [100, 200, 300, 400, 500], default: 100 },
    admissionType: { type: String, enum: Object.values(AdmissionType), default: AdmissionType.UTME },
    totalPassedCredits: { type: Number, default: 0 },
    CGPA: { type: Number, default: 0 },
    admissionYear: {type: Date, default: new Date().getFullYear()},
}, {
    timestamps: true,
});

studentSchema.index({ department: 1 });
studentSchema.index({ status: 1 });


const Student = mongoose.model<IStudent>("Student", studentSchema);

export default Student;
