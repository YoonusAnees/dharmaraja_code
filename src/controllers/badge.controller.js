import Badge from "../models/model.badge.js";

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
    const badges = await Badge.find({ status: "active" });
    res.json({ success: true, badges });
  } catch (error) {
    next(error);
  }
};