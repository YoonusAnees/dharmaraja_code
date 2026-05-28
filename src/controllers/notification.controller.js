import Notification from "../models/model.notification.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    // Base filter: broadcast OR specific to this user
    const baseFilter = {
      $or: [{ isBroadcast: true }, { recipient: userId }],
    };
    // New (pending) members should only see system notifications
    if (req.user.role === "member" && req.user.status !== "approved") {
      baseFilter.type = { $nin: ["campaign", "event"] };
    }
    const notifications = await Notification.find(baseFilter).sort("-createdAt");
    res.json({
      success: true,
      notifications,
    });
  } catch (error) {

    res.json({
      success: true,
      notifications,
    });
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