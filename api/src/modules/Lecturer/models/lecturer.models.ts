import mongoose from "mongoose";

export interface ILecturer {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  department: mongoose.Types.ObjectId;
  staffId: string;
  user: mongoose.Types.ObjectId;
  isActive: boolean;
  courses: mongoose.Types.ObjectId[];
}

const LecturerSchema = new mongoose.Schema<ILecturer>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    staffId: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    courses: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "Course",
  default: [],
},

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

LecturerSchema.index({ user: 1 });
LecturerSchema.index({ staffId: 1 }, { unique: true });
LecturerSchema.index({ department: 1 });
LecturerSchema.index({ email: 1 });

LecturerSchema.virtual("fullName").get(function () {return `${this.firstName} ${this.lastName}`});

const Lecturer = mongoose.model<ILecturer>("Lecturer", LecturerSchema);

export default Lecturer;