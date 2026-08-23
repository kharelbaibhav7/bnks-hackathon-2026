import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { email as senderEmail, password as senderPassword } from "../constant/constant.js";
import Allocation from "../models/Allocation.js";
import Escrow from "../models/Escrow.js";
import User from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, "../../../frontend/public/logo.png");

const gmailUser = (senderEmail || "").trim();
const gmailPass = String(senderPassword || "").trim();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: gmailUser,
    pass: gmailPass.replace(/\s+/g, ""),
  },
});

const money = (value = 0) =>
  `Rs ${Number(value || 0).toLocaleString("en-NP", { maximumFractionDigits: 2 })}`;

const when = (value) =>
  value
    ? new Date(value).toLocaleString("en-NP", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const recipientsFor = (user) => {
  const list = [];
  if (user?.email) list.push(user.email);
  if (gmailUser && user?.email && !user.email.endsWith("@gmail.com") && !list.includes(gmailUser)) {
    list.push(gmailUser);
  }
  return [...new Set(list)];
};

const invoiceHtml = ({ invoiceNumber, audience, retailer, farmer, order, items, total, escrow, issuedAt }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#efe6d2;font-family:Georgia,'Times New Roman',serif;color:#1c1915;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#efe6d2;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffaf0;border:1px solid #d9cbb3;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="background:#1f3d2b;padding:22px 28px;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <img src="cid:agriflow-logo" alt="AgriFlow" width="56" height="56" style="display:block;border-radius:14px;background:#000;" />
                  </td>
                  <td align="right" style="color:#f6e7b2;">
                    <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:-0.03em;">AgriFlow Escrow</div>
                    <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#c9bea4;">Protected farm-to-mart settlement</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
                <tr>
                  <td>
                    <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6256;">Invoice</div>
                    <div style="font-size:28px;line-height:1;margin-top:4px;">${invoiceNumber}</div>
                  </td>
                  <td align="right" style="font-family:Arial,sans-serif;font-size:13px;color:#6b6256;">
                    Issued ${when(issuedAt)}<br/>
                    For ${audience}<br/>
                    Status: <span style="color:#2f6f3e;font-weight:700;">Released from escrow</span>
                  </td>
                </tr>
              </table>

              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right:12px;">
                    <div style="background:#f3ead8;border-radius:16px;padding:14px 16px;">
                      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6256;">Mart</div>
                      <div style="font-size:18px;margin-top:4px;">${retailer.storeName || retailer.name}</div>
                      <div style="font-family:Arial,sans-serif;font-size:13px;color:#6b6256;">
                        ${retailer.name}<br/>
                        ${retailer.phone || ""}<br/>
                        ${retailer.email}<br/>
                        ${[retailer.address, retailer.area, retailer.city].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </td>
                  <td width="50%" valign="top" style="padding-left:12px;">
                    <div style="background:#dcead8;border-radius:16px;padding:14px 16px;">
                      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6256;">Farmer</div>
                      <div style="font-size:18px;margin-top:4px;">${farmer.farmName || farmer.name}</div>
                      <div style="font-family:Arial,sans-serif;font-size:13px;color:#6b6256;">
                        ${farmer.name}<br/>
                        ${farmer.phone || ""}<br/>
                        ${farmer.email}<br/>
                        ${[farmer.address, farmer.area, farmer.city].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
                <tr style="background:#1f3d2b;color:#f6e7b2;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">
                  <th align="left" style="padding:10px 12px;">Produce</th>
                  <th align="right" style="padding:10px 12px;">Qty</th>
                  <th align="right" style="padding:10px 12px;">Rate</th>
                  <th align="right" style="padding:10px 12px;">Amount</th>
                </tr>
                ${items
                  .map(
                    (item, index) => `
                  <tr style="background:${index % 2 ? "#f7f0e1" : "#fffaf0"};font-family:Arial,sans-serif;font-size:14px;">
                    <td style="padding:10px 12px;border-bottom:1px solid #e8dcc4;">${item.displayName}</td>
                    <td align="right" style="padding:10px 12px;border-bottom:1px solid #e8dcc4;">${item.quantity} ${item.unit}</td>
                    <td align="right" style="padding:10px 12px;border-bottom:1px solid #e8dcc4;">${money(item.pricePerUnit)}</td>
                    <td align="right" style="padding:10px 12px;border-bottom:1px solid #e8dcc4;"><strong>${money(item.amount)}</strong></td>
                  </tr>`
                  )
                  .join("")}
              </table>

              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" style="font-family:Arial,sans-serif;font-size:13px;color:#6b6256;padding-right:12px;">
                    <div style="border:1px dashed #d4a017;border-radius:16px;padding:12px 14px;background:#fff6d8;">
                      <strong style="color:#7a5b08;">Escrow trail</strong><br/>
                      Ref ${escrow?.reference || "—"}<br/>
                      Held ${when(escrow?.heldAt)}<br/>
                      Released ${when(escrow?.releasedAt)}<br/>
                      Order ${String(order._id).slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6256;">Settled total</div>
                    <div style="font-size:34px;color:#1f3d2b;margin-top:4px;">${money(total)}</div>
                    <div style="font-family:Arial,sans-serif;font-size:12px;color:#2f6f3e;">Paid from AgriFlow escrow · no middleman cut</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f3ead8;padding:16px 28px;font-family:Arial,sans-serif;font-size:12px;color:#6b6256;">
              This invoice was generated automatically when the mart received the goods and AgriFlow released escrow.
              Keep it for your books. Questions stay inside the AgriFlow order thread.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const sendInvoiceMail = async ({ to, subject, html }) => {
  if (!gmailUser || !gmailPass) {
    throw new Error("Nodemailer email or password is missing in constant/.env");
  }
  const attachments = [];
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: "logo.png",
      path: logoPath,
      cid: "agriflow-logo",
    });
  }
  await transporter.sendMail({
    from: `"AgriFlow Escrow" <${gmailUser}>`,
    to: to.join(", "),
    subject,
    html,
    attachments,
  });
};

export const sendOrderInvoices = async (order) => {
  if (!order || order.invoiceSent) return { sent: false, reason: "already-sent" };

  const allocations = await Allocation.find({
    order: order._id,
    status: "delivered",
  }).populate("farmer").populate("retailer");

  if (!allocations.length) return { sent: false, reason: "no-delivered" };

  const retailer = allocations[0].retailer || (await User.findById(order.retailer));
  const invoiceNumber = order.invoiceNumber || `INV-${String(order._id).slice(-8).toUpperCase()}`;
  const issuedAt = new Date();
  const results = [];

  const allItems = allocations.flatMap((allocation) => allocation.items);
  const allTotal = allocations.reduce((sum, item) => sum + item.totalAmount, 0);
  const firstEscrow = await Escrow.findOne({ order: order._id }).sort({ createdAt: 1 });

  await sendInvoiceMail({
    to: recipientsFor(retailer),
    subject: `${invoiceNumber} · AgriFlow escrow settlement`,
    html: invoiceHtml({
      invoiceNumber,
      audience: retailer.storeName || retailer.name,
      retailer,
      farmer: {
        name: `${allocations.length} farm${allocations.length === 1 ? "" : "s"}`,
        farmName: allocations.map((item) => item.farmer?.farmName || item.farmer?.name).join(", "),
        email: allocations.map((item) => item.farmer?.email).filter(Boolean).join(", "),
        phone: "",
        address: "Multiple pickups",
        area: "",
        city: "",
      },
      order,
      items: allItems,
      total: allTotal,
      escrow: firstEscrow,
      issuedAt,
    }),
  });
  results.push({ role: "retailer", email: retailer.email });

  for (const allocation of allocations) {
    const escrow = await Escrow.findOne({ allocation: allocation._id });
    await sendInvoiceMail({
      to: recipientsFor(allocation.farmer),
      subject: `${invoiceNumber} · Your AgriFlow farm receipt`,
      html: invoiceHtml({
        invoiceNumber: `${invoiceNumber}-${String(allocation._id).slice(-4).toUpperCase()}`,
        audience: allocation.farmer.farmName || allocation.farmer.name,
        retailer,
        farmer: allocation.farmer,
        order,
        items: allocation.items,
        total: allocation.totalAmount,
        escrow,
        issuedAt,
      }),
    });
    results.push({ role: "farmer", email: allocation.farmer.email });
  }

  order.invoiceSent = true;
  order.invoiceSentAt = issuedAt;
  order.invoiceNumber = invoiceNumber;
  await order.save();
  return { sent: true, invoiceNumber, results };
};
