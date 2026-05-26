import mongoose from "mongoose";
import dotenv from "dotenv";
import Donation from "./models/model.donation.js";
import Campaign from "./models/model.campaign.js";
import Payment from "./models/model.payment.js";
import connectDB from "./config/db.js";

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
      await Payment.findOneAndDelete({ orderId: d.transactionReference });
      console.log("Deleted payment.");

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
