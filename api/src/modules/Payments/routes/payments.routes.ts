import { Router } from "express";
import { PaymentController } from "../controller/payment.controller"; 
import { validateToken } from "../../../shared/middleware/auth.middleware";
const paymentRouter = Router();

// ── WEBHOOK — must be BEFORE auth middleware ──────────────────────────────
paymentRouter.post("/webhook", PaymentController.handleWebhook);

paymentRouter.use(validateToken);

// Student routes
paymentRouter.post("/initiate", PaymentController.initiatePayment);
paymentRouter.get("/verify/:reference", PaymentController.verifyPayment);
paymentRouter.get("/my-payments", PaymentController.getStudentPayments);

export default paymentRouter;