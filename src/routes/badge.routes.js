import express from "express";
import { createBadge, getBadges } from "../controllers/badge.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", protect, getBadges);
router.post("/", protect, adminOnly, createBadge);

export default router;