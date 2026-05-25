import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,

    campaignType: {
      type: String,
      enum: ["fixed", "open", "event"],
      required: true,
    },

    fixedAmount: {
      type: Number,
      default: 0,
    },

    targetAmount: {
      type: Number,
      default: 0,
    },

    collectedAmount: {
      type: Number,
      default: 0,
    },

    deadline: Date,
    image: String,

    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);