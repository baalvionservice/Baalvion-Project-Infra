/**
 * @fileOverview Route handler for partnership-plan survey submissions.
 *
 * POST /api/partnership
 *   - Validates the body against `partnershipSchema`.
 *   - Rate limits per client IP (sliding window).
 *   - Honeypot trap: silently succeeds for bot submissions.
 *   - Notifies the partnerships desk via the provider-agnostic email abstraction.
 *   - Returns a consistent { success, ... } envelope; never leaks internals.
 */

import { partnershipSchema } from "@/lib/validation/forms";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

const PARTNERSHIPS_EMAIL = "partnerships@baalvion.com";
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

    const limit = rateLimit(`partnership:${ip}`, {
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    });
    if (!limit.success) {
      const retryAfterSec = Math.ceil(limit.retryAfterMs / 1000);
      serverLogger.warn("partnership.rate_limited", { ip, retryAfterSec });
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

    const parsed = partnershipSchema.safeParse(body);
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
      serverLogger.warn("partnership.honeypot_triggered", { ip });
      return Response.json({
        success: true,
        message: "Your partnership request has been received.",
      });
    }

    // Notify the partnerships desk. Email failure must not fail the submission.
    const emailResult = await sendEmail({
      to: PARTNERSHIPS_EMAIL,
      replyTo: data.email,
      subject: `New partnership survey: ${data.company}`,
      text: [
        `Name: ${data.name}`,
        `Company: ${data.company}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone}`,
        `Material: ${data.material}`,
        `Monthly volume: ${data.volume}`,
        `Supply type: ${data.supply_type ?? "n/a"}`,
        `Budget: ${data.budget ?? "n/a"}`,
        `Challenges: ${data.challenges.join(", ")}`,
        `Source: ${data.source ?? "unknown"}`,
      ].join("\n"),
    });

    // Redacted summary only — no PII beyond what's needed for triage metrics.
    serverLogger.info("partnership.submission_received", {
      material: data.material,
      volume: data.volume,
      challengeCount: data.challenges.length,
      emailDomain: data.email.split("@")[1] ?? "unknown",
      source: data.source ?? "unknown",
      emailDelivered: emailResult.success,
      emailProvider: emailResult.provider,
    });

    return Response.json({
      success: true,
      message: "Your partnership request has been received. Our team will follow up shortly.",
    });
  } catch (error: unknown) {
    serverLogger.error("partnership.unhandled_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json(
      { success: false, error: GENERIC_ERROR },
      { status: 500 }
    );
  }
}
