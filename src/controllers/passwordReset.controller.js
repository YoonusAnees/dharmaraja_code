import bcrypt from "bcryptjs";
import PasswordReset from "../models/model.passwordReset.js";
import User from "../models/model.user.js";
import { sendBrevoEmail, emailTemplate } from "../services/email.service.js";
import crypto from "crypto";

// Helper to generate a 6-digit numeric OTP
const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await PasswordReset.create({ email, otp, expiresAt, used: false });
    // Send OTP email
    const html = emailTemplate({
      title: "Password Reset OTP",
      body: `<p>Dear ${user.fullName},</p><p>Your OTP for password reset is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });
    await sendBrevoEmail({ to: email, subject: "Password Reset OTP", html });
    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const record = await PasswordReset.findOne({ email, otp, used: false });
    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const record = await PasswordReset.findOne({ email, otp, used: false });
    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findOneAndUpdate({ email }, { password: hashed });
    record.used = true;
    await record.save();
    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};
