/**
 * Map raw Supabase auth errors into friendly user-facing copy.
 * Frontend-only helper — no backend changes.
 */
export function friendlyAuthError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw =
    typeof err === "string"
      ? err
      : (err as { message?: string } | null)?.message ?? "";

  const msg = raw.toLowerCase();

  if (!msg) return fallback;

  if (msg.includes("invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (msg.includes("user already registered") || msg.includes("already registered"))
    return "This email is already registered. Try signing in instead.";
  if (msg.includes("user not found")) return "We couldn't find an account with that email.";
  if (msg.includes("password should be") || msg.includes("password")) return "Password doesn't meet the requirements.";
  if (msg.includes("rate limit") || msg.includes("too many requests"))
    return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("token has expired") || msg.includes("expired"))
    return "This link has expired. Please request a new one.";
  if (msg.includes("invalid token") || msg.includes("invalid otp"))
    return "This link is invalid. Please request a new one.";
  if (msg.includes("network") || msg.includes("fetch")) return "Network problem. Check your connection and try again.";
  if (msg.includes("captcha")) return "Captcha verification failed. Please try again.";
  if (msg.includes("signups not allowed") || msg.includes("signup is disabled"))
    return "New sign-ups are currently disabled.";

  return raw || fallback;
}
