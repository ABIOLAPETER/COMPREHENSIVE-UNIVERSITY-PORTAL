import mongoose from "mongoose";

export interface ILecturer {
    email: string
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    department?: mongoose.Types.ObjectId;
    staffId?: string;
    user: mongoose.Types.ObjectId;
    faculty: mongoose.Types.ObjectId;
    isActive: boolean
    courses?: mongoose.Types.ObjectId[]
}


const LecturerSchema = new mongoose.Schema<ILecturer>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    staffId: { type: String, unique:true, sparse: true },
    email: { type: String, unique:true },
    courses: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: [] },
    isActive: {type: Boolean, default: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"}
}, {
    timestamps: true,
});

LecturerSchema.index({ department: 1 });
LecturerSchema.index({ faculty: 1 });

const Lecturer = mongoose.model<ILecturer>("Lecturer", LecturerSchema);

export default Lecturer;