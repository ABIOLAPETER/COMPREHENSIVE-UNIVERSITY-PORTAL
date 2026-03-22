import { Router } from "express";
import { PaymentController } from "../controller/payment.controller"; 
import { validateToken } from "../../../shared/middleware/auth.middleware";
const router = Router();

// ── WEBHOOK — must be BEFORE auth middleware ──────────────────────────────
// Paystack calls this directly — no JWT
router.post("/webhook", PaymentController.handleWebhook);

// ── PROTECTED ROUTES ──────────────────────────────────────────────────────
router.use(validateToken);

// Student routes
router.post("/initiate", PaymentController.initiatePayment);
router.get("/verify/:reference", PaymentController.verifyPayment);
router.get("/my-payments", PaymentController.getStudentPayments);

export default router;