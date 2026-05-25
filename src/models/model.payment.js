import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["registration", "donation", "badge", "event"],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "itemModel",
      required: true,
    },
    itemModel: {
      type: String,
      enum: ["User", "Campaign", "Badge", "Event"],
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "LKR",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    payhereReference: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
