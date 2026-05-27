// models/User.js

import mongoose from "mongoose";

const badgeHistorySchema = new mongoose.Schema({
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Badge",
    required: true,
  },

  purchasedAt: {
    type: Date,
    default: Date.now,
  },

  expiresAt: {
    type: Date,
    default: null,
  },
});

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    contactNumber: {
      type: String,
    },

    batchYear: {
      type: String,
    },

    branch: {
      type: String,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    registrationFeePaid: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },

    nic: {
      type: String,
      // NIC is optional; required for members only
      // unique constraint remains to prevent duplicates when provided
      // required: true, // removed to allow admin creation without NIC
      unique: true,
    },

    address: {
      type: String,
    },

    jobTitle: {
      type: String,
    },

    profilePicture: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Badge purchase history
    badgeHistory: [badgeHistorySchema],

    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;