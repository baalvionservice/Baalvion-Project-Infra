# Passwordless Email-OTP Login

Lets a user sign in with a one-time code emailed to them — no password. Built on top of the
existing centralized RS256 auth, so it issues the **same session** as password / social login.

## Where it lives

| Backend | Serves | Endpoints |
|---|---|---|
| `Backend/services/identity/auth-service` (central) | every site that routes login to the central issuer: admin, dashboard, CTM, Amarisé, GTI, … | `POST /v1/auth/email/otp/request`, `POST /v1/auth/email/otp/verify` |
| `Backend/services/infrastructure/proxy-service` | `proxy.baalvionstack.com` (its own customer auth on :4000) | `POST /v1/auth/email/otp/request`, `POST /v1/auth/email/otp/verify` |

Every frontend reaches these via its existing `/auth-bff/*` rewrite → `/v1/auth/*`. The backend
support is therefore **universal** — once a frontend adds the UI, it works.

### API

```
POST /auth-bff/email/otp/request   { "email": "user@example.com" }
  → 200 { success, data: { sentTo, expiresAt, resendAvailableInSeconds } }

POST /auth-bff/email/otp/verify    { "email": "user@example.com", "code": "123456" }
  → 200 { success, data: { token|accessToken, user, isNewUser } }   (+ sets httpOnly refresh cookie)
```

## Security model

- Codes are random 6-digit numbers; only `sha256(code)` is stored (`auth.email_otps` /
  `email_otps`). Plaintext is never persisted.
- Exactly **one live code per email** — each request burns the prior live codes.
- Single-use (`consumed_at`), 10-min TTL, 5-attempt lockout, 60s resend cooldown.
- Keyed by **email** (pre-auth): on a successful verify the account is found-or-created exactly
  like social login (passwordless account + provisioned org), and the email is marked verified.
- **MFA**: central auth refuses the OTP fast-path for MFA accounts (they must use password +
  second factor). Proxy mirrors its own social-login behavior.
- Delivery is **fail-loud in production**: if SMTP is not configured the service returns
  `EMAIL_DELIVERY_UNAVAILABLE` (503) instead of silently dropping the code into a dev logger.
- Per-IP rate limits on both routes (central: 20/h request, 30/15m verify).

## Operator steps to enable (per hosted deployment)

1. **AWS SES** — verify the sender domain/identity, move SES out of sandbox, and create SMTP
   credentials. Set in the deployment's `.env.prod`:
   ```
   EMAIL_FROM=noreply@baalvion.com           # an SES-verified identity
   SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=<ses smtp username>
   SMTP_PASS=<ses smtp password>
   OTP_EMAIL_BRAND=Baalvion                  # optional; brand in the email
   ```
   Already wired into: `deploy/core-stack` (auth-service + notification-service),
   `deploy/proxy-baalvionstack` (proxy-service). `deploy/ec2-single-host` already points at SES.

2. **Apply the migration** (idempotent) as the migration/owner role:
   - central: `pnpm --filter auth-service migrate` (adds `auth.email_otps` — migration `012`)
   - proxy: `pnpm --filter proxy-service migrate` (adds `email_otps` — `sql/004`)

3. **Rebuild / redeploy** the affected service so the new env + routes take effect.

> Tunables (env, optional — sensible defaults): `OTP_LENGTH=6`, `OTP_TTL_SECONDS=600`,
> `OTP_MAX_ATTEMPTS=5`, `OTP_RESEND_COOLDOWN_S=60`.

## Frontend status (consumer sites only — admin console intentionally excluded)

All four shipped surfaces follow the same shape: a collapsed "Email me a login code" button →
email step → 6-digit code step → the app's existing "set session" path.

| Frontend | Base path | Files |
|---|---|---|
| **Proxy-BaalvionStack** (Vite) | `/auth-bff` (proxy-service) | `src/lib/authClient.ts` (+OTP methods), `src/components/auth/EmailOtpLogin.tsx`, mounted in `src/pages/public/AuthPage.tsx` |
| **Amarisé** (Next) | `/auth-bff` (central) | `src/lib/auth.ts` (+OTP methods → `applySession`), `src/components/account/EmailOtpLogin.tsx`, mounted in `…/account/login/page.tsx` |
| **ControlTheMarket** (Next) | `/auth-bff` (central, via auth-gateway) | `src/contexts/auth-context.tsx` (+`loginWithOtp` sharing `establishCtmSession`), `src/components/auth/email-otp-login.tsx`, mounted in `…/(public)/login/page.tsx` |
| **GTI public** (Next) | `/trade-bff/auth/*` → **auth-gateway** | gateway route `email/otp/{request,verify}` in `auth-gateway/routes/auth.js`, `src/lib/admin-api.ts` `publicAuthApi.requestEmailOtp/verifyEmailOtp`, `src/app/login/_components/email-otp-login.tsx`, mounted in `src/app/login/page.tsx` |

**GTI note:** unlike the others, its login is cookie-based behind the **auth-gateway** (explicit
per-route handlers — no blanket `/auth/*` passthrough). The new gateway routes mirror `/login`:
`request` is a pure passthrough; `verify` calls auth-service then `establish()`s the session
cookies, and the page hard-navigates so the AppProvider rehydrates (same as its MFA-complete flow).
Caddy's existing `/trade-bff/auth/*` prefix rule already routes these — no Caddy change needed.

To add another consumer frontend later: add the two client methods on the app's existing auth base,
drop in an equivalent component, and call the app's "set session" function after verify.
