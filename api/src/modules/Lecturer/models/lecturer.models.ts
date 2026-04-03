import mongoose, { Document } from "mongoose";

export interface ILecturer extends Document {
  email:      string;
  firstName:  string;
  lastName:   string;
  department: mongoose.Types.ObjectId;
  faculty:    mongoose.Types.ObjectId;
  staffId:    string;
  user:       mongoose.Types.ObjectId;
  isActive:   boolean;
  courses:    mongoose.Types.ObjectId[];
  createdAt:  Date;
  updatedAt:  Date;
}

const LecturerSchema = new mongoose.Schema<ILecturer>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },

    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    department: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Department",
      required: true,
    },

    faculty: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Faculty",
      required: true,
    },

    staffId: {
      type:     String,
      required: true,
      unique:   true,
    },

    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true,
    },

    courses: {
      type:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
      default: [],
    },

    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Indexes — only for non-unique fields
// LecturerSchema.index({ user: 1 });
LecturerSchema.index({ department: 1 });
LecturerSchema.index({ faculty: 1 });

LecturerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Lecturer = mongoose.model<ILecturer>("Lecturer", LecturerSchema);
export default Lecturer;