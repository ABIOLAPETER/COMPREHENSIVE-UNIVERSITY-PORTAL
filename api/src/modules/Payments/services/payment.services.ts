import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";
import { PaymentModel, IPayment, PaymentStatus } from "../model/payment.model";
import { InitiatePaymentDto } from "../dtos/payments.dtos";
import { NotFoundError, BadRequestError, ConflictError, AuthError } from "../../../shared/errors/AppError";
import Student from "../../student/models/student.model";
import { RegistrationModel, RegistrationStatus } from "../../registration/models/registration.model";
import { env } from "../../../config/env";
import { UserModel } from "../../identity/models/identity.models";

const PAYSTACK_BASE = "https://api.paystack.co";
const SCHOOL_FEE_AMOUNT = 5000000; // ₦50,000 in kobo

export class PaymentService {

  static async initiatePayment(data: InitiatePaymentDto): Promise<{ authorizationUrl: string; reference: string }> {
    const { studentId, registrationId } = data;

    const student = await Student.findById(studentId).populate("user");
    if (!student) throw new NotFoundError("Student not found");

    const registration = await RegistrationModel.findById(registrationId);
    if (!registration) throw new NotFoundError("Registration not found");

    if (registration.status !== RegistrationStatus.DRAFT) {
      throw new BadRequestError("Only draft registrations can be paid for");
    }

    // Check if already paid
    const existingPayment = await PaymentModel.findOne({
      studentId,
      registrationId,
      status: PaymentStatus.SUCCESS,
    });
    if (existingPayment) {
      throw new ConflictError("School fees already paid for this registration");
    }

    // Generate unique reference
    const reference = `PAY-${studentId}-${Date.now()}`;

    // Get student email from populated user
    const user = await UserModel.findById(student.user).populate("email")
    if (!user) throw new NotFoundError("user not found");

    const email = user.email;

    // Call Paystack initialize
    const paystackRes = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email,
        amount:    SCHOOL_FEE_AMOUNT,
        reference,
        metadata: {
          studentId,
          registrationId,
          session: registration.session,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Save pending payment record
    await PaymentModel.create({
      studentId,
      registrationId,
      session:   registration.session,
      amount:    SCHOOL_FEE_AMOUNT,
      status:    PaymentStatus.PENDING,
      reference,
    });

    return {
      authorizationUrl: paystackRes.data.data.authorization_url,
      reference,
    };
  }

  static async verifyPayment(reference: string): Promise<IPayment> {
    const payment = await PaymentModel.findOne({ reference });
    if (!payment) throw new NotFoundError("Payment record not found");

    // Call Paystack verify
    const paystackRes = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = paystackRes.data.data;

    if (paystackData.status !== "success") {
      payment.status           = PaymentStatus.FAILED;
      payment.paystackResponse = paystackData;
      await payment.save();
      throw new BadRequestError("Payment was not successful");
    }
      console.log("Updating registration:", payment.registrationId); // ← add this

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      payment.status           = PaymentStatus.SUCCESS;
      payment.paidAt           = new Date();
      payment.paystackResponse = paystackData;
      await payment.save({ session });

      await RegistrationModel.findByIdAndUpdate(
        payment.registrationId,
        { feesPaid: true },
        { session }
      );
const check = await RegistrationModel.findById(payment.registrationId).session(session);
  console.log("Registration after update:", check?.feesPaid);
      await session.commitTransaction();
      return payment;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async handleWebhook(payload: any, signature: string, rawBody: string): Promise<void> {
  const hash = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody) // ← use rawBody not JSON.stringify(payload)
    .digest("hex");

  if (hash !== signature) {
    throw new AuthError("Invalid webhook signature");
  }

  if (payload.event === "charge.success") {
    const reference = payload.data.reference;
    const existing  = await PaymentModel.findOne({ reference, status: PaymentStatus.SUCCESS });
    if (!existing) {
      await this.verifyPayment(reference);
    }
  }
}

  static async getStudentPayments(studentId: string): Promise<IPayment[]> {
    const payments = await PaymentModel
      .find({ studentId })
      .sort({ createdAt: -1 });
    return payments;
  }
}