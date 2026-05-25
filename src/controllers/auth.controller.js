import bcrypt from "bcryptjs";
import User from "../models/model.user.js";
import RefreshToken from "../models/model.refreshToken.js";
import Badge from "../models/model.badge.js";
import Event from "../models/model.event.js";
import Donation from "../models/model.donation.js";
import { registerUser, approveUser, registerAdminService } from "../services/auth.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
} from "../services/token.service.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "Registration submitted. Payment received. Awaiting approval.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const registerAdmin = async (req, res, next) => {
  try {
    const { fullName, email, password, branch, contactNumber } = req.body;

    const adminSecret = req.headers["x-admin-secret"] || req.body.adminSecret;
    if (process.env.ADMIN_SECRET_KEY && adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Unauthorized admin registration" });
    }

    const user = await registerAdminService({
      fullName,
      email,
      password,
      branch,
      contactNumber,
    });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role === "member" && user.status !== "approved") {
      return res.status(403).json({ message: "Account pending admin approval" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const oldToken = req.cookies.refreshToken;

    if (!oldToken) return res.status(401).json({ message: "No refresh token" });

    const stored = await RefreshToken.findOne({
      token: oldToken,
      revoked: false,
    }).populate("user");

    if (!stored) return res.status(401).json({ message: "Invalid refresh token" });

    const accessToken = generateAccessToken(stored.user);
    const newRefreshToken = await rotateRefreshToken(oldToken, stored.user);

    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    await RefreshToken.findOneAndUpdate({ token }, { revoked: true });
  }

  clearAuthCookies(res);

  res.json({ success: true, message: "Logged out" });
};

export const me = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

export const approveMember = async (req, res, next) => {
  try {
    const user = await approveUser(req.params.id);

    res.json({
      success: true,
      message: "Member approved",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const members = await User.find({ role: "member" }).select("-password");
    res.json({
      success: true,
      members,
    });
  } catch (error) {
    next(error);
  }
};

export const markMemberAsPaid = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.registrationFeePaid = true;
    await user.save();
    res.json({
      success: true,
      message: "Member marked as paid successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const { fullName, email, contactNumber, batchYear, branch, role, status, registrationFeePaid } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (batchYear !== undefined) user.batchYear = batchYear;
    if (branch !== undefined) user.branch = branch;
    if (role) user.role = role;
    if (status) user.status = status;
    if (registrationFeePaid !== undefined) user.registrationFeePaid = registrationFeePaid;

    await user.save();
    res.json({
      success: true,
      message: "Member updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user?._id?.toString()) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getMembersDirectory = async (req, res, next) => {
  try {
    // Fetch all approved member accounts, populating their badge and events
    const members = await User.find({ role: "member", status: "approved" })
      .select("fullName email contactNumber batchYear branch badge events createdAt")
      .populate("badge")
      .populate("events")
      .sort("fullName");

    // Fetch and append matching donation details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const donations = await Donation.find({ member: member._id, paymentStatus: "paid" })
          .populate("campaign");

        return {
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          contactNumber: member.contactNumber,
          batchYear: member.batchYear,
          branch: member.branch,
          badge: member.badge,
          events: member.events,
          createdAt: member.createdAt,
          donations,
        };
      })
    );

    res.json({
      success: true,
      members: membersWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, contactNumber, batchYear, branch, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (batchYear !== undefined) user.batchYear = batchYear;
    if (branch !== undefined) user.branch = branch;

    if (password) {
      user.password = await bcrypt.hash(password, 12);
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};