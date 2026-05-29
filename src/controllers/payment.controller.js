import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/model.user.js";
import Campaign from "../models/model.campaign.js";
import Badge from "../models/model.badge.js";
import Event from "../models/model.event.js";
import Donation from "../models/model.donation.js";
import Payment from "../models/model.payment.js";
import { sendBrevoEmail, approvalEmail, pendingApprovalEmail, registrationPaymentEmail } from "../services/email.service.js";

const PAYHERE_URL = process.env.PAYHERE_MODE === "production"
  ? "https://www.payhere.lk/pay/checkout"
  : "https://sandbox.payhere.lk/pay/checkout";

// ─── Helper: Build PayHere payload ───────────────────────────────────────────
const getPayHerePayload = ({
  orderId,
  amount,
  firstName,
  lastName,
  email,
  contactNumber,
  description,
  returnPath,
  cancelPath,
  paymentMeta, // { userId, type, itemId, amount } — stored in custom_1 for webhook
}) => {
  const merchantId = process.env.PAYHERE_MERCHANT_ID || "";
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "";
  const formattedAmount = Number(amount).toFixed(2);
  const currency = "LKR";

  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const hash = crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${formattedAmount}${currency}${secretHash}`)
    .digest("hex")
    .toUpperCase();

  return {
    merchant_id: merchantId,
    return_url: `${process.env.FRONTEND_URL}${returnPath}&order_id=${orderId}`,
    cancel_url: `${process.env.FRONTEND_URL}${cancelPath || returnPath}&order_id=${orderId}`,
    notify_url: `${process.env.BACKEND_URL || process.env.FRONTEND_URL}/api/payments/payhere-notify`,
    order_id: orderId,
    items: description,
    currency,
    amount: formattedAmount,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: contactNumber || "",
    address: "Dharmaraja College",
    city: "Kandy",
    country: "Sri Lanka",
    hash,
    // custom_1 carries all info needed by the webhook to create the Payment record
    custom_1: paymentMeta ? JSON.stringify(paymentMeta) : "",
  };
};

// ─── Helper: resolve itemModel from type ─────────────────────────────────────
const itemModelForType = (type) => {
  const map = { donation: "Campaign", badge: "Badge", event: "Event", registration: "User" };
  return map[type] || "User";
};

// ─── Helper: fulfill a paid payment (add badge, event, donation, etc.) ──────
const fulfillPayment = async (payment) => {
  if (payment.type === "registration") {
    const user = await User.findById(payment.item);
    if (user) {
      user.registrationFeePaid = true;
      user.status = "pending";
      await user.save();

      try {
        await sendBrevoEmail({
          to: user.email,
          subject: "Registration Payment Received",
          html: registrationPaymentEmail(user.fullName),
        });
      } catch (e) {
        console.error("Email send failed:", e.message);
      }
    }
  }

  if (payment.type === "donation") {
    try {
      await Donation.create({
        member: payment.user,
        campaign: payment.item,
        amount: payment.amount,
        paymentStatus: "paid",
        transactionReference: payment.orderId,
      });

      // Atomic increment — safe against race conditions
      const updatedCampaign = await Campaign.findByIdAndUpdate(
        payment.item,
        { $inc: { collectedAmount: payment.amount } },
        { new: true } // return updated doc
      );

      // Auto-complete campaign when target is reached
      if (
        updatedCampaign &&
        updatedCampaign.targetAmount > 0 &&
        updatedCampaign.collectedAmount >= updatedCampaign.targetAmount &&
        updatedCampaign.status !== "completed"
      ) {
        await Campaign.findByIdAndUpdate(payment.item, { $set: { status: "completed" } });
      }
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        console.log(`Duplicate donation skipped for orderId: ${payment.orderId}`);
      } else {
        throw dupErr;
      }
    }
  }

  if (payment.type === "badge") {
    const badge = await Badge.findById(payment.item);
    const user = await User.findById(payment.user);
    if (user && badge) {
      const now = new Date();

      // Guard: reject if user already has an active (non-expired) copy of this badge
      const alreadyActive = user.badgeHistory.some((entry) => {
        const isSameBadge = entry.badge.toString() === payment.item.toString();
        const notExpired = !entry.expiresAt || entry.expiresAt > now;
        return isSameBadge && notExpired;
      });

      if (!alreadyActive) {
        // Compute expiry date
        let expiresAt = null;
        if (badge.durationMonths && badge.durationMonths > 0) {
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + badge.durationMonths);
        }

        user.badgeHistory.push({
          badge: payment.item,
          purchasedAt: now,
          expiresAt,
        });
        await user.save();
      }
    }
  }

  if (payment.type === "event") {
    const user = await User.findById(payment.user);
    if (user) {
      user.events = user.events || [];
      if (!user.events.map(String).includes(payment.item.toString())) {
        user.events.push(payment.item);
        await user.save();
      }
    }
  }
};

const createOrderId = () => new mongoose.Types.ObjectId().toString();

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION PAYMENT
// Registration is special: we create the user + payment record upfront because
// the user doesn't exist yet at webhook time.
// ─────────────────────────────────────────────────────────────────────────────
export const initiateRegistrationPayment = async (req, res, next) => {
  try {
    const { fullName, email, contactNumber, batchYear, address, nic, jobTitle } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: "Full name and email are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists. Please use another email or contact admin." });
    }

    // Generate a temporary password for the new member (required by the schema)
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const user = await User.create({
      fullName,
      email,
      contactNumber,
      batchYear,
      password: hashedPassword,
      status: "pending",
      role: "member",
      address,
      nic,
      jobTitle,
      registrationFeePaid: false,
    });

    // Send acknowledgment email to the new member
    try {
      await sendBrevoEmail({
        to: user.email,
        subject: "Registration Received – Pending Approval",
        html: pendingApprovalEmail(user.fullName),
      });
    } catch (emailErr) {
      console.error("Failed to send pending approval email:", emailErr.message);
    }
    const orderId = createOrderId();

    // For registration we DO create the payment record upfront (user must exist)
    await Payment.create({
      type: "registration",
      user: user._id,
      item: user._id,
      itemModel: "User",
      orderId,
      amount: 1000,
      currency: "LKR",
      status: "pending",
    });

    // Split full name into first and last for PayHere payload
    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ") || "Member";

    const payherePayload = getPayHerePayload({
      orderId,
      amount: 1000,
      firstName,
      lastName,
      email,
      contactNumber,
      description: "Membership Registration Fee",
      returnPath: "/register?payment=success",
      cancelPath: "/register?payment=cancel",
      paymentMeta: {
        userId: user._id.toString(),
        type: "registration",
        itemId: user._id.toString(),
        amount: 1000,
      },
    });

    res.status(201).json({
      success: true,
      payhere: payherePayload,
      checkoutUrl: PAYHERE_URL,
      message: "Registration created. Redirecting to payment gateway...",
      paymentInfo: { orderId, type: "registration", itemId: user._id.toString(), amount: 1000 },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT — Donation / Badge / Event
// NO Payment record is created here. The record is created by:
//   1. handlePayHereNotification (webhook from PayHere server)
//   2. completePaymentSuccessReturn (sandbox return URL fallback)
//   3. markPaymentCancelled (cancel/decline fallback)
// ─────────────────────────────────────────────────────────────────────────────
export const createCheckoutPayment = async (req, res, next) => {
  try {
    const { type, itemId, amount: requestedAmount } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!type || !["donation", "badge", "event"].includes(type)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    let finalAmount;
    let description;

    if (type === "donation") {
      if (!itemId) return res.status(400).json({ message: "Campaign ID is required" });
      const campaign = await Campaign.findById(itemId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      finalAmount = campaign.campaignType === "fixed" ? campaign.fixedAmount : Number(requestedAmount);
      if (!finalAmount || finalAmount <= 0) return res.status(400).json({ message: "Invalid donation amount" });

      const now = new Date();
      if (campaign.startDate && now < campaign.startDate) {
        return res.status(400).json({ message: "Campaign has not started yet" });
      }
      if (campaign.endDate && now > new Date(campaign.endDate).setHours(23, 59, 59, 999)) {
        return res.status(400).json({ message: "Campaign has ended" });
      }

      description = `Donation to ${campaign.name}`;
    }

    if (type === "badge") {
      if (!itemId) return res.status(400).json({ message: "Badge ID is required" });
      const badge = await Badge.findById(itemId);
      if (!badge) return res.status(404).json({ message: "Badge not found" });
      finalAmount = badge.standardAmount;
      description = `Purchase badge: ${badge.name}`;
    }

    if (type === "event") {
      if (!itemId) return res.status(400).json({ message: "Event ID is required" });
      const event = await Event.findById(itemId);
      if (!event) return res.status(404).json({ message: "Event not found" });
      finalAmount = event.fee || 0;
      if (!finalAmount || finalAmount <= 0) return res.status(400).json({ message: "This event does not require payment" });
      description = `Event registration: ${event.title}`;
    }

    const orderId = createOrderId();

    const [firstName, ...rest] = user.fullName.trim().split(" ");
    const lastName = rest.join(" ") || "Member";

    const returnPath =
      type === "donation" ? "/member/campaigns?payment=success"
        : type === "badge" ? "/member/badges?payment=success"
          : "/member/events?payment=success";

    const cancelPath =
      type === "donation" ? "/member/campaigns?payment=cancel"
        : type === "badge" ? "/member/badges?payment=cancel"
          : "/member/events?payment=cancel";

    // paymentMeta is embedded in custom_1 so the PayHere webhook can reconstruct the payment
    const paymentMeta = {
      userId: user._id.toString(),
      type,
      itemId: itemId?.toString(),
      amount: finalAmount,
    };

    const payherePayload = getPayHerePayload({
      orderId,
      amount: finalAmount,
      firstName,
      lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      description,
      returnPath,
      cancelPath,
      paymentMeta,
    });

    res.status(201).json({
      success: true,
      payhere: payherePayload,
      checkoutUrl: PAYHERE_URL,
      message: "Payment started. Redirecting to PayHere...",
      // Return paymentInfo so the frontend can store in sessionStorage for return/cancel fallback
      paymentInfo: {
        orderId,
        type,
        itemId: itemId?.toString(),
        amount: finalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYHERE WEBHOOK (notify_url)
// Called by PayHere server on any payment outcome (success, failure, cancel)
// THIS is where we create the Payment record for the first time.
// ─────────────────────────────────────────────────────────────────────────────
export const handlePayHereNotification = async (req, res, next) => {
  try {
    const {
      merchant_id,
      order_id,
      status_code,
      amount,
      currency,
      md5sig,
      payment_id,
      custom_1,
    } = req.body;

    if (merchant_id !== process.env.PAYHERE_MERCHANT_ID) {
      return res.status(400).send("Invalid merchant id");
    }

    const secretHash = crypto
      .createHash("md5")
      .update(process.env.PAYHERE_MERCHANT_SECRET || "")
      .digest("hex");

    const expectedSignature = crypto
      .createHash("md5")
      .update(`${merchant_id}${order_id}${amount}${currency}${status_code}${secretHash}`)
      .digest("hex");

    if (!md5sig || md5sig.toLowerCase() !== expectedSignature.toLowerCase()) {
      return res.status(400).send("Invalid signature");
    }

    // Parse the paymentMeta we embedded in custom_1
    let paymentMeta = null;
    try {
      if (custom_1) paymentMeta = JSON.parse(custom_1);
    } catch (e) {
      console.error("Failed to parse custom_1:", e.message);
    }

    // Find existing Payment record (may have been created by completePaymentSuccessReturn)
    let payment = await Payment.findOne({ orderId: order_id });

    const isSuccess = Number(status_code) === 2;

    if (!payment) {
      // First time we're seeing this orderId — create the record
      if (!paymentMeta) {
        console.error(`No payment record and no custom_1 for order ${order_id}`);
        return res.status(200).send("OK"); // acknowledge to avoid PayHere retries
      }

      payment = await Payment.create({
        type: paymentMeta.type,
        user: paymentMeta.userId,
        item: paymentMeta.itemId,
        itemModel: itemModelForType(paymentMeta.type),
        orderId: order_id,
        amount: paymentMeta.amount,
        currency: currency || "LKR",
        status: isSuccess ? "paid" : "pending",
        payhereReference: payment_id || "",
      });

      if (isSuccess) {
        await fulfillPayment(payment);
      }

      return res.status(200).send("OK");
    }

    // Payment record already exists
    if (payment.status === "paid") {
      return res.status(200).send("Already processed");
    }

    if (!isSuccess) {
      // Failed/cancelled — keep as "pending" so user can retry
      console.log(`PayHere status_code ${status_code} for order ${order_id} — kept as pending`);
      return res.status(200).send("OK");
    }

    // Mark paid and fulfill
    payment.status = "paid";
    payment.payhereReference = payment_id || "";
    await payment.save();

    await fulfillPayment(payment);

    res.status(200).send("OK");
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("item")
      .sort({ createdAt: -1 });

    // Fix: registration payments should reflect the actual registrationFeePaid flag
    const processedPayments = payments.map((p) => {
      const plain = p.toObject();
      if (
        plain.type === "registration" &&
        req.user.registrationFeePaid === true &&
        plain.status !== "paid"
      ) {
        plain.status = "paid";
      }
      return plain;
    });

    res.json({ success: true, payments: processedPayments });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE PAYMENT SUCCESS RETURN
// Called from the frontend return URL (sandbox fallback — webhook may not fire)
// Creates the Payment record if it doesn't exist yet, marks it "paid".
// ─────────────────────────────────────────────────────────────────────────────
export const completePaymentSuccessReturn = async (req, res, next) => {
  try {
    const { orderId, type, itemId, amount } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Try to find by orderId + user
    let payment = await Payment.findOne({ orderId, user: req.user._id });

    if (!payment) {
      // Not created by webhook yet — create it now using info from the frontend
      if (!type || !itemId || !amount) {
        return res.status(400).json({ message: "Missing payment info (type, itemId, amount)" });
      }

      payment = await Payment.create({
        type,
        user: req.user._id,
        item: itemId,
        itemModel: itemModelForType(type),
        orderId,
        amount: Number(amount),
        currency: "LKR",
        status: "pending",
        payhereReference: `sandbox_return_${Date.now()}`,
      });
    }

    if (payment.status === "paid") {
      return res.json({ success: true, message: "Payment already marked as paid" });
    }

    // Mark paid and fulfill immediately since we are returning from PayHere success URL
    payment.status = "paid";
    await payment.save();

    await fulfillPayment(payment);

    res.json({ success: true, message: "Payment completed successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error due to concurrent requests (e.g., React StrictMode double rendering)
      // The other concurrent request successfully processed it.
      return res.json({
        success: true,
        message: "Payment completed successfully! (concurrent request handled)"
      });
    }
    console.error("completePaymentSuccessReturn ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unknown error",
      stack: error.stack
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK PAYMENT CANCELLED / DECLINED
// Called when user is redirected back with ?payment=cancel
// Creates a "pending" Payment record so user can retry from the UI.
// ─────────────────────────────────────────────────────────────────────────────
export const markPaymentCancelled = async (req, res, next) => {
  try {
    const { orderId, type, itemId, amount } = req.body;

    if (!orderId || !type || !itemId || !amount) {
      return res.json({ success: true }); // silently ignore if no info
    }

    // Don't overwrite a paid record
    const existing = await Payment.findOne({ orderId });
    if (existing) {
      return res.json({ success: true });
    }

    await Payment.create({
      type,
      user: req.user._id,
      item: itemId,
      itemModel: itemModelForType(type),
      orderId,
      amount: Number(amount),
      currency: "LKR",
      status: "pending",
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PENDING PAYMENTS (Admin Only)
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: "pending" })
      .populate("user", "fullName email contactNumber")
      .populate("item")
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE PENDING PAYMENT
// ─────────────────────────────────────────────────────────────────────────────
export const deletePendingPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ message: "Only pending payments can be deleted" });
    }

    if (req.user.role !== "admin" && payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this payment" });
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Pending payment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

