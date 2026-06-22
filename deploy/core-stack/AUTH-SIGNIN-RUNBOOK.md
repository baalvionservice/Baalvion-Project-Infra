# Operator Runbook — Passwordless Email-OTP Sign-In (`auth.baalvion.com`)

How to take the shared, brand-aware sign-in surface from "code merged" to "live and verified."
Every step below is an **operator action** — it needs production credentials, secrets, or DNS access
that are deliberately **not** in the repo.

**Architecture (what you are turning on):**

```
any Baalvion site ──"Sign in"──▶ https://auth.baalvion.com/?brand=<slug>&return_to=<url>
                                   │ auth-baalvion (Next.js) renders in the site's theme
                                   │  1. First/Last/email + Cloudflare Turnstile → /auth-bff/email/otp/request
                                   │  2. 6-digit code                            → /auth-bff/email/otp/verify
                                   ▼  (Caddy shims /auth-bff/* → auth-service /v1/auth/* at the edge)
                                 auth-service:3001  ──sets refresh cookie on .baalvion.com──┐
                                   ▼                                                         │ shared SSO
        redirect → <site>/auth/sso-callback?next=…#token=<jwt>  ◀───────────────────────────┘
```

Everything runs on the **core-stack** EC2 host (the same box that already runs `auth-service`).
`auth-baalvion` and the Caddy `auth.baalvion.com` vhost were added to
[`docker-compose.prod.yml`](docker-compose.prod.yml) and [`Caddyfile`](Caddyfile).

---

## 0. Prerequisites / inventory

| Need | Where it comes from |
|---|---|
| Core host SSH + `/opt/baalvion-core` repo checkout | existing core-stack host (Elastic IP) |
| `deploy/core-stack/.env.production` on the host | already present; you will add keys to it |
| AWS account with SES + the ECR deploy role (`AWS_DEPLOY_ROLE_ARN`) | existing |
| Cloudflare account (for Turnstile) | new — see §3 |
| DNS control for `baalvion.com` | existing registrar/Cloudflare |
| Repo **variable** `TURNSTILE_SITE_KEY` (public) | you set it in GitHub → §3 |

> **Order matters.** Do §1→§5 (migrate, secrets, SES, Turnstile, DNS) **before** §6/§7 (deploy), or the
> first sign-in will fail on a missing column, a missing cookie scope, or an unverified email sender.

---

## 1. Database migrations `012` + `013`

Migrations are **idempotent and additive** (new table + nullable columns + best-effort backfill) — no
locks, no RLS changes, safe to re-run.

- `012_email_otp_login.sql` — the `auth.email_otps` table (the OTP store).
- `013_user_first_last_name.sql` — `first_name` / `last_name` on `auth.users` (+ backfill from `full_name`).

**Apply against the in-compose Postgres (run from the repo root on the host):**

```bash
cd /opt/baalvion-core
set -a; . deploy/core-stack/.env.production; set +a          # load POSTGRES_* + DB creds
NET="$(docker compose -f deploy/core-stack/docker-compose.prod.yml ps --format '{{.Name}}' \
      | head -1 | sed 's/-[a-z-]*-[0-9]*$//')_default"        # or: docker network ls | grep core

docker run --rm --network "$NET" \
  -v "$PWD/Backend/services/identity/auth-service/migrations:/migs:ro" \
  -e PGHOST=postgres -e PGUSER="$POSTGRES_USER" -e PGPASSWORD="$POSTGRES_PASSWORD" -e PGDATABASE="$POSTGRES_DB" \
  postgres:16 bash -c '
    psql -v ON_ERROR_STOP=1 -f /migs/012_email_otp_login.sql &&
    psql -v ON_ERROR_STOP=1 -f /migs/013_user_first_last_name.sql'
```

> On a **fresh** DB run the full chain instead (`auth-service` `pnpm migrate` applies `001…013` then RLS `009`
> last). On the existing core box only `012` + `013` are new.

**Verify:**

```bash
docker run --rm --network "$NET" -e PGPASSWORD="$POSTGRES_PASSWORD" postgres:16 \
  psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
  "\d auth.email_otps" -c "SELECT column_name FROM information_schema.columns
   WHERE table_schema='auth' AND table_name='users' AND column_name IN ('first_name','last_name');"
```

Expect the `email_otps` table to exist and both name columns to be listed.

---

## 2. Required environment variables

Two destinations. **Runtime** vars go in `deploy/core-stack/.env.production` **on the host** (never
committed). The **build-time** public key goes in GitHub as a repo **variable** (it is baked into the
browser bundle).

### 2a. Host runtime — `deploy/core-stack/.env.production`

```ini
DOMAIN_AUTH=auth.baalvion.com

# Cross-subdomain SSO — scope the refresh cookie to the apex (one sign-in shared by every *.baalvion.com).
REFRESH_COOKIE_DOMAIN=.baalvion.com

# Cloudflare Turnstile SECRET (server-side siteverify on auth-service). KEEP SECRET. See §3.
TURNSTILE_SECRET_KEY=<from Cloudflare>

# AWS SES SMTP — REQUIRED; auth-service refuses to issue OTP codes in prod without a real SMTP_HOST. See §4.
EMAIL_FROM=noreply@baalvion.com
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<SES SMTP username>
SMTP_PASS=<SES SMTP password>

# CORS — add cross-apex consumers that call auth-service directly (same-origin /auth-bff/* needs none).
CORS_ORIGINS=https://admin.baalvion.com,https://auth.baalvion.com,https://amarisemaisonavenue.com

# Optional: extra non-baalvion.com return_to apexes the surface will accept (comma-separated).
AUTH_ALLOWED_RETURN_HOSTS=amarisemaisonavenue.com,baalvionstack.com,controlthemarket.com
```

Full annotated template: [`.env.production.example`](.env.production.example).

### 2b. GitHub repo **variable** (build-time, public — baked into `auth-baalvion`)

```
Settings → Secrets and variables → Actions → Variables → New repository variable
  TURNSTILE_SITE_KEY          = <Cloudflare Turnstile SITE key>      (public)
  AUTH_ALLOWED_RETURN_HOSTS   = amarisemaisonavenue.com,...          (optional)
```

`deploy-core-stack.yml` bakes these into the `core-auth-baalvion` image at build via
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `NEXT_PUBLIC_ALLOWED_RETURN_HOSTS`. **If you change the site key you must
rebuild the image** (it is compiled into the bundle, not read at runtime).

---

## 3. Cloudflare Turnstile

1. Cloudflare dashboard → **Turnstile** → **Add widget**.
2. **Hostnames:** add `auth.baalvion.com` **and** every consumer apex that shows the widget directly
   (e.g. `baalvion.com`, `amarisemaisonavenue.com`, `controlthemarket.com`).
3. Widget mode: **Managed** (recommended).
4. Copy the two keys:
   - **Site Key** (public) → GitHub repo variable `TURNSTILE_SITE_KEY` (§2b).
   - **Secret Key** → host `.env.production` `TURNSTILE_SECRET_KEY` (§2a).

> Posture: when `TURNSTILE_SECRET_KEY` is set, auth-service **enforces** the captcha and **fails closed** on
> any verifier error. Leaving both keys blank ships the flow with **no** captcha (dev only).

---

## 4. AWS SES / SMTP

1. SES console (region `ap-south-1`, or match `SMTP_HOST`) → **Verified identities** → verify the
   `EMAIL_FROM` address **or** the whole `baalvion.com` domain (domain verification is better — enables any
   `*@baalvion.com` sender and DKIM).
2. **Move SES out of the sandbox** (Account dashboard → request production access). In sandbox you can only
   send to pre-verified recipients — real users won't receive codes.
3. **SMTP credentials:** SES → **SMTP settings** → **Create SMTP credentials** → fill `SMTP_USER` / `SMTP_PASS`
   (these are SES SMTP creds, **not** IAM access keys).
4. Put `SMTP_HOST` / `SMTP_PORT` (587, STARTTLS) / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` in §2a.

**Verify SES independently before deploying:**

```bash
aws ses send-email --region ap-south-1 \
  --from noreply@baalvion.com \
  --destination ToAddresses=you@example.com \
  --message 'Subject={Data=SES check},Body={Text={Data=ok}}'
```

---

## 5. DNS for `auth.baalvion.com`

Add an **A record** pointing at the core host's Elastic IP (the same IP as `api`/`cms`/`admin.baalvion.com`):

```
auth.baalvion.com.   A   <core-host-EIP>     proxy: OFF (DNS-only) if using Cloudflare
```

> If `auth.baalvion.com` is fronted by Cloudflare's orange-cloud proxy, **set it to DNS-only (grey cloud)**
> so Caddy can complete the Let's Encrypt HTTP-01 challenge and own TLS — otherwise you get redirect loops /
> cert errors. Caddy auto-provisions and renews the cert once the A record resolves to the box.

Confirm: `dig +short auth.baalvion.com` returns the core EIP before you deploy.

---

## 6. Deploy `auth-service` (with the new OTP/SSO env)

`auth-service` is already in the core stack; it just needs the §2a env and a roll.

> **First-time only — provision the ECR repositories.** The `build-push` job auto-creates each
> `baalvion/core-*` ECR repo on first push **only if the deploy role has `ecr:CreateRepository`**. If it
> doesn't, builds for *new* services fail at the **"Ensure ECR repository exists"** step (the Docker build
> never runs — you'll see `core-auth-baalvion`, `core-rbac-service`, etc. fail while existing repos like
> `core-auth-service` succeed). Fix it one of two ways:
>
> - **Grant the role** `ecr:CreateRepository` + `ecr:DescribeRepositories` (then the workflow self-provisions), **or**
> - **Pre-create the repos once** (the established pattern):
>
>   ```bash
>   for r in core-auth-baalvion core-rbac-service core-audit-service core-notification-service \
>            core-commerce-service core-order-service core-trade-service core-commerce-tools core-order-tools; do
>     aws ecr create-repository --repository-name "baalvion/$r" \
>       --image-scanning-configuration scanOnPush=true --region ap-south-1 || true
>   done
>   ```
>
>   `core-auth-baalvion` is the only repo this feature strictly needs; the rest cover the other core
>   services added earlier. Re-run the deploy workflow afterward.

**Option A — CI/CD (recommended):** push the merged deploy changes to `main` (or run the workflow manually):

```
GitHub → Actions → "Deploy — Core stack (ECR → EC2)" → Run workflow
```

The `build-push` job builds **all** `core-*` images (incl. the new `core-auth-baalvion`) and pushes to ECR.
The `deploy` job is gated behind the **`production`** environment → **approve it** to roll the host.

**Option B — on the host directly:**

```bash
cd /opt/baalvion-core && git pull --ff-only
nano deploy/core-stack/.env.production          # apply §2a
bash deploy/core-stack/deploy.sh                # pull + up -d --no-build, health-gated
```

**Verify auth-service:**

```bash
curl -s https://api.baalvion.com/health
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://auth.baalvion.com/auth-bff/email/otp/request \
  -H 'content-type: application/json' \
  -d '{"firstName":"Test","lastName":"User","email":"you@gmail.com"}'   # expect 200 (or 400 CAPTCHA_REQUIRED if Turnstile enforced)
```

---

## 7. Deploy `auth-baalvion`

It is now part of the core compose (`auth-baalvion` service + Caddy `auth.baalvion.com` vhost), so the §6
roll **already deploys it** — provided:

1. `TURNSTILE_SITE_KEY` repo variable is set **before** the `build-push` job runs (it's baked in).
2. `DOMAIN_AUTH` + DNS (§5) are in place so Caddy provisions TLS.

**Verify the surface:**

```bash
curl -sI https://auth.baalvion.com | head -n1                       # 200, valid TLS
curl -s "https://auth.baalvion.com/?brand=about&return_to=https://about.baalvion.com" | grep -qi 'sign' && echo "surface OK"
docker compose -f deploy/core-stack/docker-compose.prod.yml --env-file deploy/core-stack/.env.production ps auth-baalvion
```

---

## 8. OTP validation testing

**API smoke (no browser):**

```bash
# 1. request a code (captcha token omitted → only works if Turnstile is NOT enforced, e.g. staging)
curl -s -X POST https://auth.baalvion.com/auth-bff/email/otp/request \
  -H 'content-type: application/json' \
  -d '{"firstName":"Ada","lastName":"Lovelace","email":"you@gmail.com"}' | jq

# 2. read the code from the email, then verify
curl -s -c cookies.txt -X POST https://auth.baalvion.com/auth-bff/email/otp/verify \
  -H 'content-type: application/json' \
  -d '{"email":"you@gmail.com","code":"123456"}' | jq          # → { accessToken, user{initials,...}, isNewUser }
grep -i baalvion_refresh cookies.txt                            # refresh cookie present, Domain=.baalvion.com
```

**Browser flow (the real test) — confirm each:**

| Check | Expected |
|---|---|
| New-user registration | First+Last+email → code → `isNewUser:true`, greeted by name, avatar initials |
| Existing-user sign-in | same email again → `isNewUser:false`, no duplicate user |
| First/Last name capture | name persists; `auth.users.first_name/last_name` populated |
| CAPTCHA validation | with Turnstile enforced, a missing/invalid token → `400 CAPTCHA_*`; valid token passes |
| Disposable-email block | `foo@mailinator.com` → `400 DISPOSABLE_EMAIL` (no code sent) |
| Undeliverable domain | `foo@nxdomain.invalid` → `400 EMAIL_DOMAIN_INVALID` |
| Session handoff | redirect to `<site>/auth/sso-callback?next=…#token=…`; token in URL **hash** only |
| Rate limits | >3 resends within the window → blocked; code expires after 5 min |

---

## 9. Cross-platform SSO validation

For each site: click **Sign in** → you should land on `auth.baalvion.com` themed for that brand, complete the
OTP, and return **signed in**. The shared `.baalvion.com` refresh cookie keeps the session across subdomains.

| Site | Brand slug | Sign-in entry |
|---|---|---|
| Amarisé (cross-apex) | `amarise` | header "Sign in" — session arrives via `#token` (no shared cookie cross-apex) |
| Jobs Portal | `jobs` | public header |
| Global Trade Infrastructure | `gti` | institutional header |
| IR Baalvion | `ir` | header |
| Imperialpedia | `imperialpedia` | navbar |
| Law Elite Network | `law` | public navbar |
| Mining Baalvion | `mining` | navbar |
| About Baalvion | `about` | navbar |
| Brand Connector | `brand-connector` | header |
| ControlTheMarket | `ctm` | navbar |
| Proxy BaalvionStack | `proxy` | public header (Vite SPA → `sharedAuth.ts`) |
| baalvion.com | — | its **own** `/signin` form (Cloudflare Worker), not the redirect surface |

**Per-site checks:**
- `*.baalvion.com` sites: after sign-in, refresh the page → still signed in (shared cookie works).
- **Amarisé** is cross-apex (`amarisemaisonavenue.com`): the shared cookie does **not** reach it; verify the
  `#token` handoff on `/auth/sso-callback` establishes the session, and that the apex is in
  `AUTH_ALLOWED_RETURN_HOSTS` (else `return_to` is rejected by the open-redirect guard).
- Confirm `return_to` to a non-allow-listed host (e.g. `https://evil.com`) is **rejected**.

---

## 10. Rollback

The change is **additive** — rollback is low-risk.

| Layer | Rollback |
|---|---|
| Bad image roll | `bash deploy/core-stack/deploy.sh <previous-git-sha>` (deploy.sh prints the command on a failed health gate) |
| Disable the surface only | stop just the app: `docker compose … stop auth-baalvion` (other core services keep serving) |
| Disable captcha enforcement | clear `TURNSTILE_SECRET_KEY` in `.env.production` → roll (server check is skipped) |
| Revert cookie scope | clear `REFRESH_COOKIE_DOMAIN` → roll (back to host-only cookies; cross-site SSO off) |
| DB | migrations are additive; **no rollback needed**. If you must, `ALTER TABLE auth.users DROP COLUMN first_name, DROP COLUMN last_name;` and `DROP TABLE auth.email_otps;` (destroys pending codes) |
| Full revert | revert the deploy/auth-surface PR on `main`; the next roll removes the service + vhost |

Pin an immutable tag for a known-good host: set `IMAGE_TAG=<git-sha>` in `.env.production`.

---

## 11. Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| `auth.baalvion.com` TLS / cert error | DNS A record not pointing at the box, or Cloudflare orange-cloud proxy on. Set DNS-only; `dig +short auth.baalvion.com`. Check `docker compose logs caddy`. |
| OTP request returns `500` / no email | SES not configured or in sandbox; `SMTP_*` wrong. `docker compose logs auth-service` for the mailer error. Test SES with §4. |
| `400 CAPTCHA_REQUIRED` / always fails | Site key not baked (rebuild after setting `TURNSTILE_SITE_KEY`), or `auth.baalvion.com` not in the Turnstile widget hostnames, or secret/site keys are from different widgets. |
| Signed in on the surface but **not** on the site | `REFRESH_COOKIE_DOMAIN` not `.baalvion.com`, or the site is cross-apex (Amarisé) — verify the `#token` handoff and `AUTH_ALLOWED_RETURN_HOSTS`. |
| `return_to` rejected | Target host isn't `*.baalvion.com` and isn't in `AUTH_ALLOWED_RETURN_HOSTS`. Add the apex. |
| CORS error in console | Cross-apex site calling auth-service directly without being in `CORS_ORIGINS`. Add its origin. |
| `build-push` fails at **"Ensure ECR repository exists"** (build skipped) | Deploy role lacks `ecr:CreateRepository` for a new repo (`core-auth-baalvion` etc.). Grant it, or pre-create the repo — see §6 "provision the ECR repositories". |
| `core-auth-baalvion` image not found on roll | `build-push` didn't run / failed before the host pulled. Re-run the workflow; the host only pulls. |
| Disposable-email false positive for a real domain | Domain matches the disposable list or has no MX/A. Override per env: `EMAIL_REQUIRE_MX=false` (last resort) or whitelist upstream. |
| `[BOS] Invalid environment variables` at a frontend build | A client module imported a server-env file; read `NEXT_PUBLIC_*` directly (see the about-web fix in this work). |

**Log shortcuts (on the host):**

```bash
C="docker compose -f deploy/core-stack/docker-compose.prod.yml --env-file deploy/core-stack/.env.production"
$C ps                         # health of every service
$C logs --tail=100 auth-baalvion
$C logs --tail=100 auth-service | grep -iE 'otp|mail|turnstile|cookie'
$C logs --tail=50 caddy
```
