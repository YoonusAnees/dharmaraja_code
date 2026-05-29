import express from "express";
import {
  initiateRegistrationPayment,
  createCheckoutPayment,
  handlePayHereNotification,
  getMyPayments,
  completePaymentSuccessReturn,
  markPaymentCancelled,
  getPendingPayments,
  deletePendingPayment,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/registration", initiateRegistrationPayment);
router.post("/checkout", protect, createCheckoutPayment);
router.post("/payhere-notify", handlePayHereNotification);
router.get("/my-payments", protect, getMyPayments);
router.patch("/complete-success", protect, completePaymentSuccessReturn);
router.post("/mark-cancelled", protect, markPaymentCancelled);

router.get("/pending", protect, adminOnly, getPendingPayments);
router.delete("/:id", protect, deletePendingPayment);

export default router;
