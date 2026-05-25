import Donation from "../models/model.donation.js";
import Campaign from "../models/model.campaign.js";

export const donateToCampaign = async (req, res, next) => {
  try {
    const { campaignId, amount, transactionReference } = req.body;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const donation = await Donation.create({
      member: req.user._id,
      campaign: campaignId,
      amount,
      paymentStatus: "paid",
      transactionReference,
    });

    campaign.collectedAmount += Number(amount);
    await campaign.save();

    res.status(201).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};