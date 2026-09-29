# auth-baalvion — shared sign-in for the Baalvion platform

A single, **brand-aware** authentication surface (`auth.baalvion.com`) used by every Baalvion site.
Passwordless **email-OTP**: the user enters First name, Last name and email, verifies a 6-digit code,
and is greeted by name with auto-generated avatar initials — then handed back to the site they came
from via SSO.

The page renders in the **theme of whichever site sent the user** (dark "ledger" for baalvion.com,
light editorial for about.baalvion.com, …), so it feels native rather than a separate login page.

## How it works

```
site ──"Sign in"──▶ auth.baalvion.com/?brand=…&return_to=…
                      │  1. First/Last/email + Cloudflare Turnstile  → POST /auth-bff/email/otp/request
                      │  2. 6-digit code                             → POST /auth-bff/email/otp/verify
                      │  3. "Welcome, {firstName} 👋" + avatar chip
                      ▼
                    redirect → <site>/auth/sso-callback?next=…#token=<jwt>
```

- `/auth-bff/*` is a same-origin rewrite to the central **auth-service** `/v1/auth/*`.
- The refresh cookie is set on `.baalvion.com`, so every subdomain shares the session.
- Server-side guarantees (in auth-service): disposable/temp-email rejection, MX-validated domains,
  Turnstile verification, OTP expiry **5 min**, **max 3 resends**, per-IP + per-email rate limits.

## Develop

```bash
pnpm install
pnpm --filter auth-baalvion dev   # http://localhost:3055
# Requires auth-service on :3001 (or set AUTH_SERVICE_URL). No Turnstile key needed locally.
```

Try a brand: `http://localhost:3055/?brand=about&return_to=http://localhost:3020`

## Configure

See [.env.example](.env.example). Add new brands in [src/lib/themes.ts](src/lib/themes.ts) and wire a
site with [INTEGRATION.md](INTEGRATION.md).
