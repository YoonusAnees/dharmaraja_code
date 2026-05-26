import Badge from "../models/model.badge.js";
import User from "../models/model.user.js";

export const createBadge = async (req, res, next) => {
  try {
    const badge = await Badge.create(req.body);
    res.status(201).json({ success: true, badge });
  } catch (error) {
    next(error);
  }
};

export const getBadges = async (req, res, next) => {
  try {
    const badges = await Badge.find({ status: "active" }).sort({ standardAmount: 1 });
    res.json({ success: true, badges });
  } catch (error) {
    next(error);
  }
};

// Returns the logged-in user's badge history (with badge details populated)
export const getMyBadgeHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("badgeHistory.badge");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, badgeHistory: user.badgeHistory || [] });
  } catch (error) {
    next(error);
  }
};