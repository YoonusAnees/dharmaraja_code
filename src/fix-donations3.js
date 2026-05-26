import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Dynamic import to avoid path issues
const Donation = (await import("./models/model.donation.js")).default;
const Campaign = (await import("./models/model.campaign.js")).default;
const Payment = (await import("./models/model.payment.js")).default;

dotenv.config();

async function fix() {
  await connectDB();

  console.log("Looking for false donations...");
  const fakeDonations = await Donation.find({ amount: { $gt: 1000000 } });

  if (fakeDonations.length > 0) {
    for (const d of fakeDonations) {
      console.log(`Found fake donation: ${d.amount} LKR for campaign ${d.campaign}`);
      
      // Fix campaign amount
      await Campaign.findByIdAndUpdate(d.campaign, {
        $inc: { collectedAmount: -d.amount }
      });
      console.log("Subtracted from campaign.");

      // Delete payment
      if (d.transactionReference) {
        await Payment.findOneAndDelete({ orderId: d.transactionReference });
        console.log("Deleted payment.");
      }

      // Delete donation
      await Donation.findByIdAndDelete(d._id);
      console.log("Deleted donation.");
    }
  } else {
    console.log("No fake donations > 1,000,000 LKR found.");
  }

  process.exit(0);
}

fix();
