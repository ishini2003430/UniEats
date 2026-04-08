const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

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
  // If SMTP is configured, use it. Otherwise, in non-production use Ethereal test account
  if (canSendEmails()) {
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
  }

  if (process.env.NODE_ENV === "production") {
    // production but not configured - create a noop transporter to avoid crashes
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  // development fallback: create Ethereal test account lazily
  // (nodemailer.createTestAccount is async; create a sync-like wrapper using a cached transporter)
  const testAccount = nodemailer.createTestAccount ? null : null;
  // createTestAccount is async; create transporter synchronously by creating a promise and awaiting below in sendEmail
  transporter = null;
  return null;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return { skipped: true, reason: "missing_recipient" };

  if (!canSendEmails()) {
    // try to fall back to Ethereal in development
    if (process.env.NODE_ENV !== "production") {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const ethTransport = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await ethTransport.sendMail({
          from: SMTP_FROM || testAccount.user,
          to,
          subject,
          text,
          html,
        });

        return { sent: true, preview: nodemailer.getTestMessageUrl(info) };
      } catch (err) {
        console.error("Ethereal fallback send failed:", err);
        // fall through to local file fallback
      }
    }

    // If SMTP and Ethereal both failed or are not available, write the email to a local file
    try {
      const outDir = path.join(process.cwd(), "tmp_emails");
      try {
        fs.mkdirSync(outDir, { recursive: true });
      } catch (e) {}

      const safeTo = String(to).replace(/[^a-z0-9@.\-]/gi, "_");
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2,8)}_${safeTo}.html`;
      const filePath = path.join(outDir, filename);

      const body = `<!doctype html>
<html><head><meta charset="utf-8"><title>${subject}</title></head><body>
<h2>To: ${to}</h2>
<h3>Subject: ${subject}</h3>
<hr/>
${html || `<pre>${(text||"").replace(/</g,'&lt;')}</pre>`}
</body></html>`;

      fs.writeFileSync(filePath, body, "utf8");
      console.warn(`SMTP not configured — wrote email to ${filePath}`);
      return { skipped: true, reason: "smtp_not_configured", logged: true, path: filePath };
    } catch (err) {
      console.error("Failed to write fallback email file:", err);
      return { skipped: true, reason: "smtp_not_configured" };
    }
  }

  // Use configured transporter if available
  let tx = getTransporter();
  if (!tx) {
    // transporter not created synchronously above; create using configured SMTP (shouldn't happen) or fallback
    tx = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  const info = await tx.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  // If using Ethereal or test transport, return preview URL when available
  const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
  return { sent: true, preview };
};

module.exports = {
  sendEmail,
  canSendEmails,
};
