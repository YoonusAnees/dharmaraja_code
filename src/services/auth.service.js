import bcrypt from "bcryptjs";
import crypto from "crypto";
import Payment from "../models/model.payment.js";
import User from "../models/model.user.js";
import { approvalEmail, sendBrevoEmail, pendingApprovalEmail } from "./email.service.js";

export const registerUser = async (data) => {
  const exists = await User.findOne({ email: data.email });

  if (exists) {
    throw new Error("Email already exists");
  }

  // Generate a temporary password since the frontend no longer provides one
  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const user = await User.create({
    fullName: data.fullName,
    email: data.email,
    contactNumber: data.contactNumber,
    batchYear: data.batchYear,
    password: hashedPassword,
    status: "pending",
    role: "member",
    registrationFeePaid: false,
    address: data.address,
    nic: data.nic,
    jobTitle: data.jobTitle,
  });

  try {
    await sendBrevoEmail({
      to: user.email,
      subject: "Registration Pending Approval",
      html: pendingApprovalEmail(user.fullName),
    });
  } catch (emailError) {
    console.error("Failed to send registration pending email via Brevo:", emailError.message);
  }

  return user;
};


export const approveUser = async (userId) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  // Generate random password
  const plainPassword = crypto.randomBytes(8).toString("hex");
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  user.status = "approved";
  user.registrationFeePaid = true;
  user.password = hashedPassword;
  // Update any pending registration payment records to paid
  await Payment.updateMany({ user: user._id, type: 'registration', status: 'pending' }, { status: 'paid' });
  await user.save();
  try {
    await sendBrevoEmail({
      to: user.email,
      subject: "Registration Approved",
      html: approvalEmail({
        name: user.fullName,
        email: user.email,
        password: plainPassword,
      }),
    });
  } catch (emailError) {
    console.error("Failed to send approval email via Brevo:", emailError.message);
  }

  return user;
};

export const registerAdminService = async (data) => {
  const exists = await User.findOne({ email: data.email });

  if (exists) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    fullName: data.fullName,
    email: data.email,
    contactNumber: data.contactNumber,
    branch: data.branch,
    password: hashedPassword,
    status: "approved",
    role: "admin",
    registrationFeePaid: true,
  });

  return user;
};