import { NextRequest, NextResponse } from "next/server";
import { createHmac, createHash } from "crypto";

// ─── AWS SES via REST + Signature V4 (zero extra packages) ───────────────────
// Using the SES v1 "email" endpoint which accepts application/x-www-form-urlencoded.
// This avoids the @aws-sdk/client-ses transitive dep that rejects Node 26.
//
// Set in .env.local:
//   AWS_REGION=ap-south-1
//   AWS_ACCESS_KEY_ID=AKIAxxxx
//   AWS_SECRET_ACCESS_KEY=xxxxxxxx
//   SES_FROM_EMAIL=Baalvion Nightlife <noreply@baalvion.com>
//   ADMIN_EMAIL=admin@baalvion.com
//   NEXT_PUBLIC_SITE_URL=https://community.marketunderworld.com
//
// On EC2/ECS with IAM role: credentials are fetched from instance metadata.

const AWS_REGION  = process.env.AWS_REGION          ?? "ap-south-1";
const ACCESS_KEY  = process.env.AWS_ACCESS_KEY_ID   ?? "";
const SECRET_KEY  = process.env.AWS_SECRET_ACCESS_KEY ?? "";
const FROM_EMAIL  = process.env.SES_FROM_EMAIL      ?? "Baalvion Nightlife <noreply@baalvion.com>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL         ?? "admin@baalvion.com";
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://community.marketunderworld.com";

// ─── Minimal AWS Signature V4 ─────────────────────────────────────────────────
function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}
function hash(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}
function getSigningKey(secretKey: string, date: string, region: string, service: string): Buffer {
  const kDate    = hmac("AWS4" + secretKey, date);
  const kRegion  = hmac(kDate,    region);
  const kService = hmac(kRegion,  service);
  return hmac(kService, "aws4_request");
}

async function sendViaSES(to: string, subject: string, html: string): Promise<boolean> {
  // Dev mode — no credentials set
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.log(`[SES DEV] To: ${to} | Subject: ${subject}`);
    return true;
  }

  const service  = "ses";
  const host     = `email.${AWS_REGION}.amazonaws.com`;
  const endpoint = `https://${host}/`;
  const method   = "POST";

  const now   = new Date();
  const amzDate   = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z"; // YYYYMMDDTHHmmssZ
  const dateStamp = amzDate.slice(0, 8); // YYYYMMDD

  const body = new URLSearchParams({
    Action:                           "SendEmail",
    "Source":                         FROM_EMAIL,
    "Destination.ToAddresses.member.1": to,
    "Message.Subject.Data":           subject,
    "Message.Subject.Charset":        "UTF-8",
    "Message.Body.Html.Data":         html,
    "Message.Body.Html.Charset":      "UTF-8",
  }).toString();

  const bodyHash = hash(body);
  const canonicalHeaders = `content-type:application/x-www-form-urlencoded\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders    = "content-type;host;x-amz-date";
  const canonicalRequest = [method, "/", "", canonicalHeaders, signedHeaders, bodyHash].join("\n");

  const credentialScope  = `${dateStamp}/${AWS_REGION}/${service}/aws4_request`;
  const stringToSign     = ["AWS4-HMAC-SHA256", amzDate, credentialScope, hash(canonicalRequest)].join("\n");
  const signingKey       = getSigningKey(SECRET_KEY, dateStamp, AWS_REGION, service);
  const signature        = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Host":         host,
        "X-Amz-Date":  amzDate,
        "Authorization": authorization,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[SES] Error:", res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[SES] Fetch error:", err);
    return false;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BookingEmailPayload {
  kind: "guest_list" | "vip_table";
  clubName: string;
  clubCity: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitDate: string;
  bookingRef: string;
  males?: number;
  females?: number;
  groupSize?: number;
  tablePackage?: string;
  notes?: string;
}

// ─── Email Templates ─────────────────────────────────────────────────────────
function buildUserEmail(d: BookingEmailPayload): string {
  const isVip = d.kind === "vip_table";
  const visitFormatted = new Date(d.visitDate).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const refDisplay = d.bookingRef.toUpperCase().slice(-14);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Booking Confirmation — Baalvion</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">

  <!-- Brand -->
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:#ed6c2a;color:#fff;font-weight:900;font-size:22px;padding:10px 24px;border-radius:12px;letter-spacing:3px;">BAALVION</div>
    <p style="color:#666;margin-top:10px;font-size:12px;letter-spacing:2px;">NIGHTLIFE · VIP ACCESS · EXCLUSIVE EXPERIENCES</p>
  </div>

  <!-- Hero -->
  <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:32px;text-align:center;margin-bottom:20px;">
    <div style="font-size:48px;margin-bottom:12px;">${isVip ? "🥂" : "🎟️"}</div>
    <h1 style="margin:0 0 10px;font-size:24px;font-weight:900;">${isVip ? "VIP Table Request Received!" : "You're on the Guest List!"}</h1>
    <p style="margin:0;color:#999;font-size:14px;line-height:1.7;">
      ${isVip
        ? "Your reservation has been received. Our team will contact you within 24 hours to confirm."
        : "Your guest list spot is requested. Show this email at the door on your visit night."}
    </p>
  </div>

  <!-- Details -->
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:20px;">
    <h2 style="margin:0 0 16px;font-size:13px;font-weight:700;color:#ed6c2a;text-transform:uppercase;letter-spacing:2px;">Booking Details</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:9px 0;color:#666;border-bottom:1px solid #1a1a1a;width:40%">Venue</td><td style="padding:9px 0;font-weight:600;border-bottom:1px solid #1a1a1a;">${d.clubName}, ${d.clubCity}</td></tr>
      <tr><td style="padding:9px 0;color:#666;border-bottom:1px solid #1a1a1a;">Type</td><td style="padding:9px 0;font-weight:600;border-bottom:1px solid #1a1a1a;">${isVip ? "VIP Table Reservation" : "Free Guest List Entry"}</td></tr>
      <tr><td style="padding:9px 0;color:#666;border-bottom:1px solid #1a1a1a;">Name</td><td style="padding:9px 0;font-weight:600;border-bottom:1px solid #1a1a1a;">${d.firstName} ${d.lastName}</td></tr>
      <tr><td style="padding:9px 0;color:#666;border-bottom:1px solid #1a1a1a;">Visit Date</td><td style="padding:9px 0;font-weight:600;border-bottom:1px solid #1a1a1a;">${visitFormatted}</td></tr>
      ${isVip ? `
      <tr><td style="padding:9px 0;color:#666;border-bottom:1px solid #1a1a1a;">Package</td><td style="padding:9px 0;font-weight:600;border-bottom:1px solid #1a1a1a;">${d.tablePackage ?? "Standard VIP"}</td></tr>
      <tr><td style="padding:9px 0;color:#666;border-bottom:1px solid #1a1a1a;">Group Size</td><td style="padding:9px 0;font-weight:600;border-bottom:1px solid #1a1a1a;">${d.groupSize ?? "–"} guests</td></tr>
      ` : `
      <tr><td style="padding:9px 0;color:#666;border-bottom:1px solid #1a1a1a;">Group</td><td style="padding:9px 0;font-weight:600;border-bottom:1px solid #1a1a1a;">${d.males ?? 0} Males + ${d.females ?? 0} Females</td></tr>
      `}
      <tr><td style="padding:9px 0;color:#666;">Phone</td><td style="padding:9px 0;font-weight:600;">${d.phone}</td></tr>
    </table>
  </div>

  <!-- Reference -->
  <div style="background:#1a1a1a;border:1px dashed #333;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
    <p style="margin:0 0 6px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Your Booking Reference</p>
    <p style="margin:0;color:#ed6c2a;font-family:'Courier New',monospace;font-size:22px;font-weight:900;letter-spacing:2px;">${refDisplay}</p>
    <p style="margin:10px 0 0;color:#555;font-size:11px;">📱 Screenshot this or show the email at the venue entrance</p>
  </div>

  <!-- What's Next -->
  <div style="background:#0d1a0d;border:1px solid #1a3a1a;border-radius:12px;padding:20px;margin-bottom:24px;">
    <h3 style="margin:0 0 12px;font-size:12px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:2px;">✅ What Happens Next</h3>
    <ul style="margin:0;padding-left:16px;color:#aaa;font-size:13px;line-height:2.2;">
      ${isVip
        ? `<li>Our team will call / WhatsApp you within <strong style="color:#fff;">24 hours</strong></li>
           <li>A deposit may be required to secure your table</li>
           <li>Arrive <strong style="color:#fff;">15 minutes early</strong> — tables held for 30 min max</li>`
        : `<li>Arrive at the venue on your chosen night</li>
           <li>Show this email or quote your <strong style="color:#fff;">reference number</strong> at the door</li>
           <li>Subject to venue capacity and dress code</li>`}
      <li>Carry a valid <strong style="color:#fff;">Photo ID</strong> (Aadhaar / Passport / Driving License)</li>
    </ul>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:28px;">
    <a href="${SITE_URL}/clubs/my-bookings" style="display:inline-block;background:#ed6c2a;color:#fff;font-weight:900;font-size:13px;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:1px;">
      VIEW MY BOOKINGS →
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align:center;border-top:1px solid #1a1a1a;padding-top:20px;color:#444;font-size:12px;">
    <p>Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:#ed6c2a;text-decoration:none;">${ADMIN_EMAIL}</a></p>
    <p style="color:#333;margin-top:6px;">© 2026 Baalvion Nightlife · Powered by AWS SES (${AWS_REGION})</p>
  </div>
</div>
</body></html>`;
}

function buildAdminEmail(d: BookingEmailPayload): string {
  const isVip = d.kind === "vip_table";
  const rows = [
    ["Club",       `${d.clubName}, ${d.clubCity}`],
    ["Type",       isVip ? "VIP Table" : "Guest List"],
    ["Name",       `${d.firstName} ${d.lastName}`],
    ["Email",      d.email],
    ["Phone",      d.phone],
    ["Visit Date", d.visitDate],
    ["Ref",        d.bookingRef],
    ...(isVip
      ? [["Package", d.tablePackage ?? "Standard"], ["Group Size", String(d.groupSize ?? "–")]]
      : [["Males", String(d.males ?? 0)], ["Females", String(d.females ?? 0)]]),
    ...(d.notes ? [["Notes", d.notes]] : []),
  ];

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:540px;padding:24px;">
  <h2 style="color:#ed6c2a;margin:0 0 16px;">🔔 New ${isVip ? "VIP Table" : "Guest List"} — ${d.clubName}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;border-radius:8px;overflow:hidden;border:1px solid #eee;">
    ${rows.map(([k, v], i) =>
      `<tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#fff"}">
        <td style="padding:10px 12px;color:#888;width:35%;border-bottom:1px solid #eee;">${k}</td>
        <td style="padding:10px 12px;font-weight:600;border-bottom:1px solid #eee;">${v}</td>
      </tr>`).join("")}
  </table>
  <div style="margin-top:20px;">
    <a href="${SITE_URL}/admin/clubs/bookings" style="background:#ed6c2a;color:#fff;font-weight:700;padding:12px 22px;border-radius:8px;text-decoration:none;font-size:13px;">
      Open Admin Panel →
    </a>
  </div>
  <p style="margin-top:16px;font-size:11px;color:#bbb;">Sent via Baalvion platform · AWS SES · ${new Date().toISOString()}</p>
</body></html>`;
}

// ─── POST /api/send-booking-confirmation ─────────────────────────────────────
export async function POST(req: NextRequest) {
  let data: BookingEmailPayload;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!data.email || !data.firstName || !data.clubName || !data.bookingRef) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const isVip = data.kind === "vip_table";
  const subjectUser  = isVip
    ? `🥂 VIP Table Request Received — ${data.clubName}`
    : `🎟️ Guest List Confirmed — ${data.clubName}`;
  const subjectAdmin = `[Baalvion] New ${isVip ? "VIP" : "GL"}: ${data.clubName} — ${data.firstName} ${data.lastName} (${data.visitDate})`;

  const [userResult, adminResult] = await Promise.allSettled([
    sendViaSES(data.email,  subjectUser,  buildUserEmail(data)),
    sendViaSES(ADMIN_EMAIL, subjectAdmin, buildAdminEmail(data)),
  ]);

  const userSent  = userResult.status  === "fulfilled" && userResult.value;
  const adminSent = adminResult.status === "fulfilled" && adminResult.value;
  const isDev     = !ACCESS_KEY;

  if (isDev) {
    return NextResponse.json({ success: true, dev: true, message: "Emails logged to console (set AWS_ACCESS_KEY_ID to send real emails)" });
  }

  return NextResponse.json({ success: userSent, userSent, adminSent });
}
