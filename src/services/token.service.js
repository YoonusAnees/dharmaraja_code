import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/model.refreshToken.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
  );
};

export const generateRefreshToken = async (user) => {
  const rawToken = crypto.randomBytes(64).toString("hex");

  await RefreshToken.create({
    user: user._id,
    token: rawToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return rawToken;
};

export const rotateRefreshToken = async (oldToken, user) => {
  const existing = await RefreshToken.findOne({
    token: oldToken,
    user: user._id,
    revoked: false,
  });

  if (!existing) {
    throw new Error("Invalid refresh token");
  }

  existing.revoked = true;

  const newToken = crypto.randomBytes(64).toString("hex");
  existing.replacedByToken = newToken;
  await existing.save();

  await RefreshToken.create({
    user: user._id,
    token: newToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return newToken;
};