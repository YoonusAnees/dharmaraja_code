import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: String,
    reportType: {
      type: String,
      enum: ["quarterly", "annual", "campaign", "expense", "donation"],
      required: true,
    },
    fileUrl: String,
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);