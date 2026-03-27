import { Request, Response, NextFunction } from "express";
import { getStudentIdFromRequest } from "../../../shared/utils/getIds";
import { PaymentService } from "../services/payment.services";

export class PaymentController {

  static async initiatePayment(
    req: Request<{}, {}, { registrationId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const studentId = await getStudentIdFromRequest(req);
      const registrationId = req.body.registrationId;

      const payment = await PaymentService.initiatePayment({ studentId, registrationId });

      return res.status(201).json({
        success: true,
        message: "Payment initialized",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(
    req: Request<{ reference: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const payment = await PaymentService.verifyPayment(req.params.reference);

      return res.status(200).json({
        success: true,
        message: "Payment verified",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const signature = req.headers["x-paystack-signature"] as string;

      if (!signature) {
        return res.status(400).json({ success: false, message: "Missing signature" });
      }

      // req.body is now a Buffer — convert to string for signature verification
      const rawBody = req.body.toString();
      const payload = JSON.parse(rawBody);

      await PaymentService.handleWebhook(payload, signature, rawBody);

      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
  static async getStudentPayments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const studentId = await getStudentIdFromRequest(req);
      const payments = await PaymentService.getStudentPayments(studentId);

      return res.status(200).json({
        success: true,
        message: "Payments fetched successfully",
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }
}