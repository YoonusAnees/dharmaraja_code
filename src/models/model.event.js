import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    eventDate: Date,
    location: String,
    image: String,
    fee: {
      type: Number,
      default: 0,
    },
    budget: {
      type: Number,
      default: 0,
    },
    linkedCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);