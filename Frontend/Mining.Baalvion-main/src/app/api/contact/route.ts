/**
 * @fileOverview Route handler for contact form submissions.
 *
 * POST /api/contact
 *   - Validates the body against `contactSchema`.
 *   - Rate limits per client IP (sliding window).
 *   - Honeypot trap: silently succeeds for bot submissions.
 *   - Notifies the trade desk via the provider-agnostic email abstraction.
 *   - Returns a consistent { success, ... } envelope; never leaks internals.
 */

import { contactSchema } from "@/lib/validation/forms";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

const TRADE_DESK_EMAIL = "trade@baalvion.com";
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const GENERIC_ERROR =
  "Something went wrong. Please try again or email trade@baalvion.com.";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function POST(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req);

    const limit = rateLimit(`contact:${ip}`, {
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    });
    if (!limit.success) {
      const retryAfterSec = Math.ceil(limit.retryAfterMs / 1000);
      serverLogger.warn("contact.rate_limited", { ip, retryAfterSec });
      return Response.json(
        { success: false, error: "Too many requests, please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: "Please correct the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Honeypot: a filled hidden field means a bot. Pretend success, do nothing.
    if (data.company_website) {
      serverLogger.warn("contact.honeypot_triggered", { ip });
      return Response.json({
        success: true,
        message: "Your inquiry has been received.",
      });
    }

    // Notify the trade desk. Email failure must not fail the submission —
    // the lead is still logged and can be followed up manually.
    const emailResult = await sendEmail({
      to: TRADE_DESK_EMAIL,
      replyTo: data.email,
      subject: `New contact inquiry: ${data.inquiryType}`,
      text: [
        `Name: ${data.firstName} ${data.lastName}`,
        `Email: ${data.email}`,
        `Inquiry type: ${data.inquiryType}`,
        `Source: ${data.source ?? "unknown"}`,
        "",
        "Message:",
        data.message,
      ].join("\n"),
    });

    // Redacted summary only — never log the full message body at info level.
    serverLogger.info("contact.submission_received", {
      inquiryType: data.inquiryType,
      emailDomain: data.email.split("@")[1] ?? "unknown",
      messageLength: data.message.length,
      source: data.source ?? "unknown",
      emailDelivered: emailResult.success,
      emailProvider: emailResult.provider,
    });

    return Response.json({
      success: true,
      message: "Your inquiry has been received. A trade specialist will be in touch shortly.",
    });
  } catch (error: unknown) {
    serverLogger.error("contact.unhandled_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json(
      { success: false, error: GENERIC_ERROR },
      { status: 500 }
    );
  }
}
