import express from "express";
import { donateToCampaign } from "../controllers/donation.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, donateToCampaign);

export default router;