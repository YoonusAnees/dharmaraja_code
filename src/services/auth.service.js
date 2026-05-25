import bcrypt from "bcryptjs";
import User from "../models/model.user.js";
import { approvalEmail, sendBrevoEmail } from "./email.service.js";

export const registerUser = async (data) => {
  const exists = await User.findOne({ email: data.email });

  if (exists) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    fullName: data.fullName,
    email: data.email,
    contactNumber: data.contactNumber,
    batchYear: data.batchYear,
    password: hashedPassword,
    status: "pending",
    role: "member",
    registrationFeePaid: false,
  });

  return user;
};

export const approveUser = async (userId) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  user.status = "approved";
  await user.save();

  try {
    await sendBrevoEmail({
      to: user.email,
      subject: "Registration Approved",
      html: approvalEmail({
        name: user.fullName,
        email: user.email,
        password: "Your chosen password",
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