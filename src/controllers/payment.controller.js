import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/model.user.js";
import Campaign from "../models/model.campaign.js";
import Badge from "../models/model.badge.js";
import Event from "../models/model.event.js";
import Donation from "../models/model.donation.js";
import Payment from "../models/model.payment.js";
import { sendBrevoEmail, registrationPaymentEmail } from "../services/email.service.js";

const PAYHERE_URL = process.env.PAYHERE_MODE === "production"
  ? "https://www.payhere.lk/pay/checkout"
  : "https://sandbox.payhere.lk/pay/checkout";

const getPayHerePayload = ({ orderId, amount, firstName, lastName, email, contactNumber, description, returnPath }) => {
  const merchantId = process.env.PAYHERE_MERCHANT_ID || "";
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "";
  const formattedAmount = amount.toFixed(2);
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
    cancel_url: `${process.env.FRONTEND_URL}${returnPath}&order_id=${orderId}`,
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
  };
};

const createOrderId = () => new mongoose.Types.ObjectId().toString();

export const initiateRegistrationPayment = async (req, res, next) => {
  try {
    const { fullName, email, contactNumber, batchYear, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists. Please use another email or contact admin." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName,
      email,
      contactNumber,
      batchYear,
      password: hashedPassword,
      status: "pending",
      role: "member",
      registrationFeePaid: false,
    });

    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ") || "Member";
    const orderId = createOrderId();

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

    const payherePayload = getPayHerePayload({
      orderId,
      amount: 1000,
      firstName,
      lastName,
      email,
      contactNumber,
      description: "Membership Registration Fee",
      returnPath: "/register?payment=success",
    });

    res.status(201).json({
      success: true,
      payhere: payherePayload,
      checkoutUrl: PAYHERE_URL,
      message: "Registration created. Redirecting to payment gateway...",
    });
  } catch (error) {
    next(error);
  }
};

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

    let itemModel;
    let finalAmount;
    let description;

    if (type === "donation") {
      if (!itemId) {
        return res.status(400).json({ message: "Campaign ID is required for donations" });
      }

      const campaign = await Campaign.findById(itemId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      itemModel = "Campaign";
      finalAmount = campaign.campaignType === "fixed" ? campaign.fixedAmount : Number(requestedAmount);
      if (!finalAmount || finalAmount <= 0) {
        return res.status(400).json({ message: "Invalid donation amount" });
      }

      description = `Donation to ${campaign.name}`;
    }

    if (type === "badge") {
      if (!itemId) {
        return res.status(400).json({ message: "Badge ID is required" });
      }

      const badge = await Badge.findById(itemId);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }

      itemModel = "Badge";
      finalAmount = badge.standardAmount;
      description = `Purchase badge ${badge.name}`;
    }

    if (type === "event") {
      if (!itemId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const event = await Event.findById(itemId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      itemModel = "Event";
      finalAmount = event.fee || 0;
      if (!finalAmount || finalAmount <= 0) {
        return res.status(400).json({ message: "This event does not require payment" });
      }

      description = `Event registration for ${event.title}`;
    }

    const orderId = createOrderId();
    const payment = await Payment.create({
      type,
      user: user._id,
      item: itemId,
      itemModel,
      orderId,
      amount: finalAmount,
      currency: "LKR",
      status: "pending",
    });

    const [firstName, ...rest] = user.fullName.trim().split(" ");
    const lastName = rest.join(" ") || "Member";

    const returnPath =
      type === "donation"
        ? "/member/campaigns?payment=success"
        : type === "badge"
        ? "/member/badges?payment=success"
        : "/member/events?payment=success";

    const payherePayload = getPayHerePayload({
      orderId,
      amount: finalAmount,
      firstName,
      lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      description,
      returnPath,
    });

    res.status(201).json({
      success: true,
      payhere: payherePayload,
      checkoutUrl: PAYHERE_URL,
      message: "Payment started. Redirecting to payment gateway...",
      paymentId: payment._id,
    });
  } catch (error) {
    next(error);
  }
};

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
    } = req.body;

    if (merchant_id !== process.env.PAYHERE_MERCHANT_ID) {
      return res.status(400).send("Invalid merchant id");
    }

    const secretHash = crypto.createHash("md5").update(process.env.PAYHERE_MERCHANT_SECRET || "").digest("hex");
    const expectedSignature = crypto
      .createHash("md5")
      .update(`${merchant_id}${order_id}${amount}${currency}${status_code}${secretHash}`)
      .digest("hex");

    if (!md5sig || md5sig.toLowerCase() !== expectedSignature.toLowerCase()) {
      return res.status(400).send("Invalid signature");
    }

    if (Number(status_code) !== 2) {
      return res.status(400).send("Payment not completed");
    }

    const payment = await Payment.findOne({ orderId: order_id });
    if (!payment) {
      return res.status(404).send("Payment record not found");
    }

    if (payment.status === "paid") {
      return res.status(200).send("Already processed");
    }

    payment.status = "paid";
    payment.payhereReference = payment_id || "";
    await payment.save();

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
        } catch (emailError) {
          console.error("Failed to send payment confirmation email via Brevo:", emailError.message);
        }
      }
    }

    if (payment.type === "donation") {
      const campaign = await Campaign.findById(payment.item);
      if (campaign) {
        await Donation.create({
          member: payment.user,
          campaign: payment.item,
          amount: payment.amount,
          paymentStatus: "paid",
          transactionReference: payment.orderId,
        });

        campaign.collectedAmount += payment.amount;
        await campaign.save();
      }
    }

    if (payment.type === "badge") {
      const user = await User.findById(payment.user);
      if (user) {
        user.badge = payment.item;
        await user.save();
      }
    }

    if (payment.type === "event") {
      const user = await User.findById(payment.user);
      if (user) {
        user.events = user.events || [];
        if (!user.events.includes(payment.item)) {
          user.events.push(payment.item);
          await user.save();
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    next(error);
  }
};

export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("item")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

export const completePaymentSuccessReturn = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const payment = await Payment.findOne({ orderId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found for this user" });
    }

    if (payment.status === "paid") {
      return res.json({ success: true, message: "Payment is already marked as paid" });
    }

    payment.status = "paid";
    payment.payhereReference = "local_sandbox_success_" + new Date().getTime();
    await payment.save();

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
        } catch (emailError) {
          console.error("Failed to send payment confirmation email via Brevo:", emailError.message);
        }
      }
    }

    if (payment.type === "donation") {
      const campaign = await Campaign.findById(payment.item);
      if (campaign) {
        await Donation.create({
          member: payment.user,
          campaign: payment.item,
          amount: payment.amount,
          paymentStatus: "paid",
          transactionReference: payment.orderId,
        });

        campaign.collectedAmount += payment.amount;
        await campaign.save();
      }
    }

    if (payment.type === "badge") {
      const user = await User.findById(payment.user);
      if (user) {
        user.badge = payment.item;
        await user.save();
      }
    }

    if (payment.type === "event") {
      const user = await User.findById(payment.user);
      if (user) {
        user.events = user.events || [];
        if (!user.events.includes(payment.item)) {
          user.events.push(payment.item);
          await user.save();
        }
      }
    }

    res.json({
      success: true,
      message: "Payment successfully updated to paid",
      payment,
    });
  } catch (error) {
    next(error);
  }
};
