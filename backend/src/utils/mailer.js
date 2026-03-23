const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

let transporter = null;

const canSendEmails = () => Boolean(SMTP_USER && SMTP_PASS && SMTP_FROM);

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return { skipped: true, reason: "missing_recipient" };

  if (!canSendEmails()) {
    return { skipped: true, reason: "smtp_not_configured" };
  }

  const tx = getTransporter();

  await tx.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  return { sent: true };
};

module.exports = {
  sendEmail,
  canSendEmails,
};
