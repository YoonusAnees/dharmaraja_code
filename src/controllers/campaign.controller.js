import Campaign from "../models/model.campaign.js";
import User from "../models/model.user.js";
import { sendBrevoEmail, campaignBroadcastEmail } from "../services/email.service.js";
import { createNotification } from "../services/notification.service.js";

export const createCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await createNotification({
      title: "New Campaign",
      message: campaign.name,
      type: "campaign",
      isBroadcast: true,
    });

    const members = await User.find({ role: "member", status: "approved" });

    for (const member of members) {
      await sendBrevoEmail({
        to: member.email,
        subject: "New Campaign by Dharmaraja College OBA",
        html: campaignBroadcastEmail({
          name: member.fullName,
          campaign,
        }),
      });
    }

    req.io?.emit("new-notification", {
      title: "New Campaign",
      message: campaign.name,
    });

    res.status(201).json({
      success: true,
      campaign,
    });
  } catch (error) {
    next(error);
  }
};

export const getCampaigns = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user?.role === "admin") {
      // Admin sees everything — active, completed, inactive
      filter = {};
    } else {
      // Members see active campaigns + completed ones (so they can see closed ones)
      filter = { status: { $in: ["active", "completed"] } };
    }

    const campaigns = await Campaign.find(filter).sort("-createdAt");
    res.json({ success: true, campaigns });
  } catch (error) {
    next(error);
  }
};