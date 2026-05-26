import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    contactNumber: { type: String },
    batchYear: { type: String },
    branch: { type: String },
    password: { type: String, required: true, select: false },

    registrationFeePaid: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Badge history — each purchase is recorded with its expiry date
    badgeHistory: [
      {
        badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge" },
        purchasedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: null }, // null = no expiry (lifetime)
      },
    ],
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);