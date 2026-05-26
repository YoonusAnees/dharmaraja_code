import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    standardAmount: { type: Number, required: true },
    benefits: String,
    image: String,
    // How many months the badge is valid after purchase (0 = no expiry)
    durationMonths: { type: Number, default: 12 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Badge", badgeSchema);