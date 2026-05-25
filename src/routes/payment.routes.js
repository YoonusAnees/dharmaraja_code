import express from "express";
import {
  initiateRegistrationPayment,
  createCheckoutPayment,
  handlePayHereNotification,
  getMyPayments,
  completePaymentSuccessReturn,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/registration", initiateRegistrationPayment);
router.post("/checkout", protect, createCheckoutPayment);
router.post("/payhere-notify", handlePayHereNotification);
router.get("/my-payments", protect, getMyPayments);
router.patch("/complete-success", protect, completePaymentSuccessReturn);

export default router;
