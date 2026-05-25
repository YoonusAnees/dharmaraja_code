import express from "express";
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
  markAllAsRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET all notifications
router.get("/", protect, getNotifications);

// GET unread count — MUST be before /:id routes
router.get("/unread-count", protect, getUnreadCount);

// POST mark ALL as read — MUST be before /:id routes
router.post("/read-all", protect, markAllAsRead);

// POST mark a single notification as read (param route LAST)
router.post("/:id/read", protect, markAsRead);

export default router;