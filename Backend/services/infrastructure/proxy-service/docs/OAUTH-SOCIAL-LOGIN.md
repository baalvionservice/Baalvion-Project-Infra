# Social Login — "Continue with Google / GitHub"

Adds Google + GitHub social login to the proxy login page (`/login`, e.g.
`https://proxy.baalvionstack.com/login`). It sits alongside the existing
email/password and enterprise-SSO flows and reuses the same session-minting path
(`ssoService.completeLogin`), so all three issue identical Baalvion sessions.

## Flow

```
SPA "Continue with Google"  →  GET /auth-bff/oauth/google/start        (proxy-service)
   └─ set httpOnly `oauth_tx` cookie (state nonce + PKCE verifier)
   └─ 302 → accounts.google.com / github.com  (top-level navigation)
        user consents
   └─ 302 → ${OAUTH_PUBLIC_BASE_URL}/auth-bff/oauth/google/callback
GET /auth-bff/oauth/google/callback  →  (proxy-service)
   └─ verify state == oauth_tx.nonce, exchange code (PKCE), fetch profile
   └─ find-or-create user, mint session (refresh → httpOnly cookie)
   └─ 302 → ${APP_URL}/auth/sso-callback#token=…&refresh=…
SPA /auth/sso-callback  →  stores session, enters /app
```

`/auth-bff/*` is reverse-proxied to proxy-service `/v1/auth/*` (Caddy in prod, Vite in
dev), so the SPA and these endpoints are same-origin and the cookies flow.

## Account behaviour

- **New user** → a fresh org + owner membership + trial subscription is provisioned
  (same as email/password signup), passwordless (`oauth:`-prefixed placeholder hash),
  email marked verified. They land on `/app`.
- **Returning user** → matched by social identity `(oauth_provider, oauth_provider_id)`,
  else linked to an existing account by **verified** email (we refuse unverified emails).
- A user created via OAuth has no usable password; they can set one later via
  *Forgot password* if they want email/password sign-in too.

## One-time operator setup

### 1. Register the OAuth apps

**Google** — Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID*
(type *Web application*). Authorized redirect URI:

```
https://proxy.baalvionstack.com/auth-bff/oauth/google/callback
```

(For local dev also add `http://localhost:8080/auth-bff/oauth/google/callback`.)
Copy the **Client ID** and **Client secret**.

**GitHub** — Settings → Developer settings → OAuth Apps → *New OAuth App*.
Authorization callback URL:

```
https://proxy.baalvionstack.com/auth-bff/oauth/github/callback
```

Copy the **Client ID** and generate a **Client secret**.

### 2. Set the env vars (never commit real values)

On the proxy-service (or in the deploy `.env.prod`):

```bash
OAUTH_PUBLIC_BASE_URL=https://proxy.baalvionstack.com   # serves the SPA + /auth-bff/*
APP_URL=https://proxy.baalvionstack.com                 # post-login redirect target
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
```

The redirect URI registered in each console **must** match
`${OAUTH_PUBLIC_BASE_URL}/auth-bff/oauth/<provider>/callback` exactly.

> Deploy note: the canonical production stack is `deploy/ec2-single-host`. Add the same
> six vars there too. `deploy/proxy-baalvionstack` (compose + `.env.prod.example`) is the
> proxy-specific reference and already passes them through to `proxy-service`.

### 3. Apply the migration

On an **existing / populated** database, apply only the additive OAuth migration
(idempotent — safe to re-run) as the owner/migration role:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/003_oauth_identity.sql
```

It adds `oauth_provider`, `oauth_provider_id`, `avatar_url` to `public.users` plus a partial
unique index on `(oauth_provider, oauth_provider_id)`. `password_hash` is left NOT NULL.

> Do **not** run the full `pnpm --filter proxy-service migrate` against a populated database —
> `sql/schema.sql` drops + recreates tables and is intended for fresh provisioning only. The
> `migrate` script does include `003` in its chain for new databases.

### 4. Verify

- A button with no credentials configured redirects to `/login?oauth_error=provider_not_configured`
  (the SPA shows a friendly toast) — so a missing secret degrades gracefully.
- After setting credentials: click **Continue with Google/GitHub**, consent, and you land
  on `/app` signed in. A new email creates a workspace; a returning one logs straight in.

## Security notes

- **CSRF**: a CSPRNG `state` nonce is echoed via the provider and compared to the
  httpOnly, `SameSite=Lax` `oauth_tx` cookie on callback.
- **PKCE (S256)** is used for Google; the verifier never leaves the server (tx cookie only).
- **Unverified emails are rejected** (Google `email_verified`, GitHub primary-verified
  email) to prevent account-takeover via email linking.
- No tokens reach the browser except via the existing `/auth/sso-callback` fragment hop
  (same mechanism enterprise SSO already uses); the refresh token is an httpOnly cookie.

## Known limitations (v1)

- One social identity per account (single `oauth_provider`/`oauth_provider_id` column pair).
  Signing in with a *second* provider that shares the same verified email logs the user in
  but does not overwrite the first linked identity. A dedicated `oauth_identities` table
  would be the upgrade path for multiple linked providers.
- MFA-on-OAuth and a plan passthrough (carrying `?plan=` from pricing into a social signup)
  are not handled; social signups get the default plan and can upgrade in billing.
