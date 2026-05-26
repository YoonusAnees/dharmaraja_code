import express from "express";
import { uploadExpense, createReport, getSystemAnalytics } from "../controllers/report.controller.js";
import { protect, protectMe } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/analytics", protect, getSystemAnalytics); // All logged in users can view transparency stats
router.post("/expense", protect, adminOnly, upload.single("receipt"), uploadExpense);
router.post("/", protect, adminOnly, createReport);

export default router;