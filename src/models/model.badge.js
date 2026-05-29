// models/Badge.js

import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    standardAmount: {
      type: Number,
      required: true,
    },

    benefits: {
      type: String,
    },

    image: {
      type: String,
    },

    // 0 = lifetime / no expiry
    durationMonths: {
      type: Number,
      default: 12,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Badge = mongoose.model("Badge", badgeSchema);

export default Badge;