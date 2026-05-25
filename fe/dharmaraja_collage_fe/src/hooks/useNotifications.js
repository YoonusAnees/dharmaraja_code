import { useEffect, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";

export const useNotifications = () => {
  const { liveNotification } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // fetch all notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  // fetch unread count
  const fetchUnread = async () => {
    const res = await api.get("/notifications/unread-count");
    setUnreadCount(res.data.count || 0);
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnread();
  }, []);

  // live update
  useEffect(() => {
    if (liveNotification) {
      setUnreadCount((prev) => prev + 1);

      setNotifications((prev) => [
        {
          _id: Date.now(),
          title: liveNotification.title,
          message: liveNotification.message,
          type: liveNotification.type,
          createdAt: new Date(),
        },
        ...prev,
      ]);
    }
  }, [liveNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
  };
};