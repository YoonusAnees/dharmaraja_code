import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";

export const useNotifications = () => {
  const { liveNotification } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Keep a Set of locally-read notification IDs so re-fetches don't reset them
  const localReadIds = useRef(new Set());

  // ---- fetch all notifications (preserves locally-read state) ----
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      const fetched = res.data.notifications || [];

      // Stamp _localRead on any we've already marked locally
      const merged = fetched.map((n) =>
        localReadIds.current.has(n._id) ? { ...n, _localRead: true } : n
      );
      setNotifications(merged);
    } catch (err) {
      console.error("fetchNotifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---- fetch unread count from server ----
  const fetchUnread = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error("fetchUnread error:", err);
    }
  };

  // ---- Mark ONE notification as read (OPTIMISTIC — UI first, API second) ----
  const markOneAsRead = async (notificationId) => {
    // 1. Immediately update UI
    localReadIds.current.add(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notificationId ? { ...n, _localRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // 2. Then call API (fire and forget — UI already updated)
    try {
      await api.post(`/notifications/${notificationId}/read`);
    } catch (err) {
      console.error("markOneAsRead API error:", err);
      // On failure, roll back the optimistic update
      localReadIds.current.delete(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, _localRead: false } : n
        )
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  // ---- Mark ALL notifications as read (OPTIMISTIC) ----
  const markAllRead = async () => {
    // 1. Immediately update UI
    const prevCount = unreadCount;
    setNotifications((prev) => {
      prev.forEach((n) => localReadIds.current.add(n._id));
      return prev.map((n) => ({ ...n, _localRead: true }));
    });
    setUnreadCount(0);

    // 2. Then call API
    try {
      await api.post("/notifications/read-all");
    } catch (err) {
      console.error("markAllRead API error:", err);
      // Roll back on failure
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, _localRead: false }))
      );
      localReadIds.current.clear();
      setUnreadCount(prevCount);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchUnread();
  }, []);

  // Live socket update
  useEffect(() => {
    if (liveNotification) {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [
        {
          _id: `live-${Date.now()}`,
          title: liveNotification.title,
          message: liveNotification.message,
          type: liveNotification.type,
          createdAt: new Date(),
          readBy: [],
        },
        ...prev,
      ]);
    }
  }, [liveNotification]);

  return {
    notifications,
    unreadCount,
    setUnreadCount,
    loading,
    fetchNotifications,
    markOneAsRead,
    markAllRead,
  };
};