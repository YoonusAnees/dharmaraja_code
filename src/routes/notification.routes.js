import express from "express";
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
  markAllAsRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);

router.post("/:id/read", protect, markAsRead);

router.get("/unread-count", protect, getUnreadCount);

router.post("/read-all", protect, markAllAsRead);

export default router;