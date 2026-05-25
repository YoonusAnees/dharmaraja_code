import express from "express";
import {
  register,
  registerAdmin,
  login,
  refresh,
  logout,
  me,
  approveMember,
  getMembers,
  markMemberAsPaid,
  updateMember,
  deleteMember,
  getMembersDirectory,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protect, protectMe } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/register-admin", registerAdmin);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", protectMe, me);
router.put("/me", protect, updateProfile);
router.get("/members/directory", protect, getMembersDirectory);
router.get("/members", protect, adminOnly, getMembers);
router.patch("/approve/:id", protect, adminOnly, approveMember);
router.patch("/mark-paid/:id", protect, adminOnly, markMemberAsPaid);
router.put("/members/:id", protect, adminOnly, updateMember);
router.delete("/members/:id", protect, adminOnly, deleteMember);

export default router;