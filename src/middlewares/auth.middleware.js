import jwt from "jsonwebtoken";
import User from "../models/model.user.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const protectMe = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // 1. If guest (no tokens at all), return 200 OK with null user to avoid console 401s
    if (!accessToken && !refreshToken) {
      return res.status(200).json({ success: true, user: null });
    }

    // 2. If access token is missing but refresh token is present, request is unauthorized (expired)
    if (!accessToken && refreshToken) {
      return res.status(401).json({ message: "Access token expired" });
    }

    // 3. Verify access token
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};