import express from "express";
import { createCampaign, getCampaigns } from "../controllers/campaign.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", protect, getCampaigns);
router.post("/", protect, adminOnly, createCampaign);

export default router;