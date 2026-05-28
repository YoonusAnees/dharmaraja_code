import axios from "axios";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export const sendBrevoEmail = async ({ to, subject, html }) => {
  try {
    await axios.post(
      BREVO_URL,
      {
        sender: {
          name: process.env.BREVO_SENDER_NAME,
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (error.response) {
      console.error("Brevo API Error Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Brevo Email Sending Error:", error.message);
    }
    // Re-throw so calling services can handle/fail-gracefully without crashing Express
    throw error;
  }
};

export const emailTemplate = ({ title, body, buttonText, buttonUrl }) => {
  return `
  <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
    <div style="max-width:650px;margin:auto;background:white;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#073b2e;color:white;padding:24px;text-align:center;">
        <img src="https://res.cloudinary.com/dnxzkzyze/image/upload/v1779983340/obams/dc_logo.png" alt="OBA Logo" style="width:80px;height:auto;margin-bottom:15px;display:inline-block;" />
        <h2 style="margin:0;">Dharmaraja College Old Boys Association</h2>
        <p style="margin:8px 0 0;color:#d1fae5;">OBAMS Notification</p>
      </div>

      <div style="padding:30px;color:#111827;">
        <h2 style="margin-top:0;color:#065f46;">${title}</h2>
        <div style="font-size:15px;line-height:1.7;color:#374151;">
          ${body}
        </div>

        ${buttonText && buttonUrl
      ? `<div style="margin-top:25px;">
                <a href="${buttonUrl}" style="background:#047857;color:white;text-decoration:none;padding:12px 20px;border-radius:10px;display:inline-block;">
                  ${buttonText}
                </a>
              </div>`
      : ""
    }
      </div>

      <div style="background:#f9fafb;padding:18px;text-align:center;color:#6b7280;font-size:13px;">
        © ${new Date().getFullYear()} Dharmaraja College Old Boys Association
      </div>
    </div>
  </div>
  `;
};

export const registrationPaymentEmail = (name) =>
  emailTemplate({
    title: "Registration Payment Received",
    body: `
      <p>Dear ${name},</p>
      <p>Thank you for registering with the Dharmaraja College Old Boys Association.</p>
      <p>Your registration payment has been received successfully.</p>
      <p>Your account is now pending admin approval. Login credentials will be sent after verification.</p>
    `,
  });

export const approvalEmail = ({ name, email, password }) =>
  emailTemplate({
    title: "Registration Approved",
    body: `
      <p>Dear ${name},</p>
      <p>Your member account has been approved.</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>
      <p>Please change your password after first login.</p>
    `,
  });

export const campaignBroadcastEmail = ({ name, campaign }) =>
  emailTemplate({
    title: "New Fundraising Campaign Launched",
    body: `
      <p>Dear ${name},</p>
      <p>A new campaign has been launched:</p>
      <h3>${campaign.name}</h3>
      <p>${campaign.description || ""}</p>
      <p>Please login to OBAMS to contribute.</p>
    `,
    buttonText: "View Campaign",
    buttonUrl: process.env.FRONTEND_URL,
  });