const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildEmailLayout = ({ preheader, title, subtitle, bodyHtml, footerNote }) => {
  const safePreheader = escapeHtml(preheader || "");
  const safeTitle = escapeHtml(title || "");
  const safeSubtitle = escapeHtml(subtitle || "");
  const safeFooter = escapeHtml(
    footerNote || "This is an automated message from UniEats Campus Food System."
  );

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${safePreheader}</span>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:22px 26px;background:linear-gradient(135deg,#0f172a,#1e293b);">
                <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:.2px;">UniEats</div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">Campus Food Ordering System</div>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 26px 8px 26px;">
                <h1 style="margin:0;font-size:24px;line-height:1.3;color:#0f172a;">${safeTitle}</h1>
                <p style="margin:10px 0 0 0;font-size:14px;line-height:1.7;color:#475569;">${safeSubtitle}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 26px 8px 26px;">
                ${bodyHtml}
              </td>
            </tr>

            <tr>
              <td style="padding:18px 26px 28px 26px;">
                <div style="border-top:1px solid #e2e8f0;padding-top:14px;font-size:12px;line-height:1.7;color:#64748b;">
                  ${safeFooter}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
};

const buildStudentOrderConfirmationEmail = ({ studentLabel, orderId, summaryLines }) => {
  const rows = summaryLines
    .map(
      (line) =>
        `<li style="margin:0 0 10px 0;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;font-size:13px;line-height:1.7;color:#334155;">${escapeHtml(
          line
        )}</li>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.8;color:#334155;">Hi <strong>${escapeHtml(
      studentLabel
    )}</strong>, your order has been successfully placed.</p>

    <div style="margin:0 0 14px 0;padding:14px;border:1px solid #dbeafe;background:#eff6ff;border-radius:12px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.4px;color:#1d4ed8;font-weight:700;">Order Reference</div>
      <div style="font-size:22px;font-weight:800;color:#0f172a;margin-top:4px;">${escapeHtml(orderId)}</div>
    </div>

    <div style="font-size:13px;font-weight:700;color:#334155;margin:0 0 8px 0;">Order Breakdown</div>
    <ul style="margin:0;padding-left:0;list-style:none;">${rows}</ul>
  `;

  const text = [
    `Hi ${studentLabel},`,
    "",
    `Your order ${orderId} is confirmed.`,
    "",
    ...summaryLines,
    "",
    "Thank you for ordering with UniEats.",
  ].join("\n");

  const html = buildEmailLayout({
    preheader: `Order ${orderId} confirmation`,
    title: "Order Confirmed",
    subtitle: "We have received your order and shared it with your selected vendor(s).",
    bodyHtml,
  });

  return { text, html };
};

const buildVendorNewOrderEmail = ({ vendorLabel, studentLabel, orderId, slotLabel, foodNames }) => {
  const bodyHtml = `
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.8;color:#334155;">Hi <strong>${escapeHtml(
      vendorLabel
    )}</strong>, you have a new incoming order.</p>

    <div style="margin:0 0 14px 0;padding:14px;border:1px solid #fcd34d;background:#fffbeb;border-radius:12px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.4px;color:#92400e;font-weight:700;">New Order ID</div>
      <div style="font-size:22px;font-weight:800;color:#0f172a;margin-top:4px;">${escapeHtml(orderId)}</div>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0 8px;">
      <tr>
        <td style="font-size:12px;color:#64748b;width:110px;">Student</td>
        <td style="font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(studentLabel)}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#64748b;">Pickup Slot</td>
        <td style="font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(slotLabel)}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#64748b;">Items</td>
        <td style="font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(foodNames)}</td>
      </tr>
    </table>

    <p style="margin:14px 0 0 0;font-size:13px;line-height:1.7;color:#475569;">Please update this order status from your vendor dashboard.</p>
  `;

  const text = [
    `Hi ${vendorLabel},`,
    "",
    `You received a new order ${orderId}.`,
    `Student: ${studentLabel}`,
    `Pickup Slot: ${slotLabel}`,
    `Items: ${foodNames}`,
    "",
    "Please update order status from the vendor dashboard.",
  ].join("\n");

  const html = buildEmailLayout({
    preheader: `New order ${orderId} received`,
    title: "New Order Received",
    subtitle: "A student has placed an order for your pickup slot.",
    bodyHtml,
  });

  return { text, html };
};

module.exports = {
  buildStudentOrderConfirmationEmail,
  buildVendorNewOrderEmail,
};
