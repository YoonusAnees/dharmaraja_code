import Notification from "../models/model.notification.js";

export const getNotifications = async (req, res) => {
  const userId = req.user._id;

  const notifications = await Notification.find({
    $or: [
      { isBroadcast: true },
      { recipient: userId },
    ],
  }).sort("-createdAt");

  res.json({
    success: true,
    notifications,
  });
};


export const getUnreadCount = async (req, res) => {
  const userId = req.user._id;

  const count = await Notification.countDocuments({
    $or: [
      { isBroadcast: true },
      { recipient: userId },
    ],
    readBy: { $ne: userId },
  });

  res.json({
    success: true,
    count,
  });
};


export const markAsRead = async (req, res) => {
  const userId = req.user._id;

  await Notification.updateMany(
    {
      $or: [
        { isBroadcast: true },
        { recipient: userId },
      ],
      readBy: { $ne: userId },
    },
    {
      $push: { readBy: userId },
    }
  );

  res.json({ success: true });
};


export const markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    {
      recipient: req.user._id,
      readBy: { $ne: req.user._id },
    },
    {
      $push: { readBy: req.user._id },
    }
  );

  res.json({ success: true });
};