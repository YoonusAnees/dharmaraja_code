import express from "express";
import { createEvent, getEvents } from "../controllers/event.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", protect, getEvents);
router.post("/", protect, adminOnly, createEvent);

export default router;