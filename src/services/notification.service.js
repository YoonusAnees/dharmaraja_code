import Notification from "../models/model.notification.js";
import User from "../models/model.user.js";
import { sendBrevoEmail, emailTemplate } from "./email.service.js";
import { getIO } from "../sockets/socket.js";

export const createNotification = async ({
  title,
  message,
  type,
  recipient = null,
  isBroadcast = false,
}) => {
  const notification = await Notification.create({
    title,
    message,
    type,
    recipient,
    isBroadcast,
  });

  // 🔥 SOCKET REAL-TIME DISPATCH (NEW)
  try {
    const io = getIO();

    let users = [];

    if (isBroadcast) {
      users = await User.find({ role: "member", status: "approved" });
    } else if (recipient) {
      const user = await User.findById(recipient);
      if (user) users.push(user);
    }

    for (const user of users) {
      // emit live notification
      io.to(user._id.toString()).emit("notification:new", {
        _id: notification._id,
        title,
        message,
        type,
        createdAt: notification.createdAt,
      });
    }
  } catch (socketErr) {
    console.error("Socket notification error:", socketErr.message);
  }

  // 📧 EMAIL DISPATCH (YOUR ORIGINAL LOGIC KEPT SAME)
  try {
    if (type !== "campaign") {
      if (isBroadcast) {
        const members = await User.find({
          role: "member",
          status: "approved",
        });

        for (const member of members) {
          sendBrevoEmail({
            to: member.email,
            subject: `${title} - OBAMS OBA`,
            html: emailTemplate({
              title,
              body: `
                <p>Dear ${member.fullName},</p>
                <p>There is a new update from Dharmaraja College Old Boys Association:</p>
                <div style="background:#f3f4f6; padding:15px; border-left:4px solid #047857; margin:15px 0; font-weight:bold; color:#111827;">
                  ${message}
                </div>
                <p>Please log in to the OBAMS Member Dashboard to check details.</p>
              `,
              buttonText: "Open Dashboard",
              buttonUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            }),
          }).catch((err) =>
            console.error(
              `Failed to send notification email to ${member.email}:`,
              err.message
            )
          );
        }
      } else if (recipient) {
        const user = await User.findById(recipient);

        if (user) {
          await sendBrevoEmail({
            to: user.email,
            subject: `${title} - OBAMS OBA`,
            html: emailTemplate({
              title,
              body: `
                <p>Dear ${user.fullName},</p>
                <p>You have received a new notification from Dharmaraja College Old Boys Association:</p>
                <div style="background:#f3f4f6; padding:15px; border-left:4px solid #047857; margin:15px 0; font-weight:bold; color:#111827;">
                  ${message}
                </div>
                <p>Please log in to your Member Dashboard to view details.</p>
              `,
              buttonText: "Open Dashboard",
              buttonUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            }),
          });
        }
      }
    }
  } catch (emailErr) {
    console.error("Failed to send notification emails:", emailErr.message);
  }

  return notification;
};