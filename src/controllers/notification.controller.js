import Notification from "../models/model.notification.js";

export const getNotifications = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};


export const getUnreadCount = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("getUnreadCount error:", error);
    res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
};


// Mark a SINGLE notification as read by ID
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const result = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { isBroadcast: true },
          { recipient: userId },
        ],
        readBy: { $ne: userId },
      },
      {
        $push: { readBy: userId },
      },
      { new: true }
    );

    console.log(`markAsRead: notif=${id}, user=${userId}, found=${!!result}`);

    res.json({ success: true });
  } catch (error) {
    console.error("markAsRead error:", error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};


// Mark ALL notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
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

    console.log(`markAllAsRead: user=${userId}, modified=${result.modifiedCount}`);

    res.json({ success: true });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};