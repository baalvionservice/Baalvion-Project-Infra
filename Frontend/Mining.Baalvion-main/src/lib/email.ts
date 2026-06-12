/**
 * @fileOverview Provider-agnostic email abstraction.
 *
 * `sendEmail` is the single entry point for outbound transactional email. It is
 * deliberately decoupled from any concrete provider so the rest of the codebase
 * (API route handlers) never depends on a configured email service to function.
 *
 * Graceful degradation: if no provider is configured (no EMAIL_PROVIDER env, or
 * the selected provider lacks its credentials), the email is logged as "queued"
 * via the server logger and `sendEmail` resolves successfully. It NEVER throws
 * because a provider is missing — the submission is still captured and the team
 * can follow up. Only genuine provider transport failures surface as errors.
 *
 * TODO: Wire a real provider. Read the relevant credentials inside this module
 * only (see `resolveProvider`) — e.g.:
 *   - SMTP   : SMTP_URL (or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS) via nodemailer
 *   - Resend : RESEND_API_KEY via the Resend SDK / REST API
 *   - SES    : AWS_REGION + AWS credentials via @aws-sdk/client-ses
 * Implement the matching branch in `dispatch()` and return { success, provider }.
 *
 * NOTE: This module is server-only — it reads provider credentials from
 * process.env and must only be imported by Route Handlers / Server Components,
 * never by a Client Component. (The `server-only` package can be added as a
 * compile-time guard once it is a project dependency.)
 */

import { serverLogger } from "@/lib/server-logger";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** Optional reply-to so the recipient can respond directly to the lead. */
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  /** Which transport handled the message: a provider id, or "logged" when queued only. */
  provider: string;
  error?: string;
}

type ConfiguredProvider = "smtp" | "resend" | "ses";

/**
 * Determines which provider is configured, if any. Returns null when the app is
 * running without an email provider — the graceful-degradation path.
 */
function resolveProvider(): ConfiguredProvider | null {
  const provider = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();

  if (provider === "smtp" && process.env.SMTP_URL) return "smtp";
  if (provider === "resend" && process.env.RESEND_API_KEY) return "resend";
  if (provider === "ses" && process.env.AWS_REGION) return "ses";

  return null;
}

/**
 * Sends a transactional email. Provider-agnostic and non-throwing on missing
 * configuration. Always resolves with a result describing what happened.
 */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const provider = resolveProvider();

  if (!provider) {
    // No provider configured — queue by logging. This is a normal, supported state.
    serverLogger.info("email.queued", {
      to: message.to,
      subject: message.subject,
      reason: "no_email_provider_configured",
    });
    return { success: true, provider: "logged" };
  }

  try {
    await dispatch(provider, message);
    serverLogger.info("email.sent", { to: message.to, subject: message.subject, provider });
    return { success: true, provider };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown email transport error";
    serverLogger.error("email.send_failed", {
      to: message.to,
      subject: message.subject,
      provider,
      error: errorMessage,
    });
    return { success: false, provider, error: errorMessage };
  }
}

/**
 * Provider dispatch. No concrete provider is wired yet — see the file-level TODO.
 * Until a branch is implemented we fall back to logging so a misconfigured but
 * "enabled" provider still does not drop the submission silently.
 */
async function dispatch(provider: ConfiguredProvider, message: EmailMessage): Promise<void> {
  switch (provider) {
    case "smtp":
    case "resend":
    case "ses":
      // TODO: Implement real transport for the selected provider here.
      serverLogger.warn("email.provider_not_implemented", {
        provider,
        to: message.to,
        subject: message.subject,
      });
      return;
    default:
      return;
  }
}
