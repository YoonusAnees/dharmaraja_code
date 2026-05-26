import express from "express";
import { createCampaign, getCampaigns } from "../controllers/campaign.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";
import { upload, processImage } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", protect, getCampaigns);
router.post("/", protect, adminOnly, upload.single("image"), processImage, createCampaign);

export default router;