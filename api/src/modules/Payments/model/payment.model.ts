import mongoose, { Schema, Document, Types } from "mongoose";

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED  = "FAILED"
}

export interface IPayment extends Document {
  studentId:        Types.ObjectId;
  registrationId:   Types.ObjectId;
  session:          string;
  amount:           number;
  status:           PaymentStatus;
  reference:        string;
  paystackResponse: object;
  paidAt:           Date;
  createdAt:        Date;
  updatedAt:        Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Student",
      required: true,
    },
    registrationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Registration",
      required: true,
    },
    session: {
      type:     String,
      required: true,
    },
    amount: {
      type:     Number,
      required: true,
    },
    status: {
      type:    String,
      enum:    Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
    },
    reference: {
      type:   String,
      unique: true,
      sparse: true,
    },
    paystackResponse: {
      type: Object,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ studentId: 1 });
paymentSchema.index({ registrationId: 1 });
paymentSchema.index({ studentId: 1, session: 1 });
paymentSchema.index({ reference: 1 }, { unique: true, sparse: true });

export const PaymentModel = mongoose.model<IPayment>("Payment", paymentSchema);