import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    revoked: { type: Boolean, default: false },
    replacedByToken: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("RefreshToken", refreshTokenSchema);