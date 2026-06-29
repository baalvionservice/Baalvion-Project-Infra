# Amazon SES Email Integration

Production-grade Amazon SES (AWS SDK v3) integration for the Baalvion platform. One centralized
package — `@baalvion/email` — now owns email sending across every backend service, replacing the
previous patchwork of Resend, three nodemailer variants, and two hand-rolled SMTP clients.

- **Region:** ap-south-1
- **Verified domain:** baalvion.com
- **Configuration set:** baalvion-production
- **SNS topic:** baalvion-ses-events
- **IAM user:** baalvion-ses-smtp (`ses:SendEmail`, `ses:SendRawEmail`)

No AWS resources were modified by this change — it consumes the existing infrastructure.

---

## 1. Architecture

```
                         ┌──────────────────────────────┐
  auth-service ─────────►│                              │
  proxy-service ────────►│      @baalvion/email         │   AWS SDK v3 (SESv2)
  law-service ──────────►│  ───────────────────────────  ├──────────────────────►  Amazon SES
  jobs-service ─────────►│  EmailService (DI)            │   ses:SendEmail            (ap-south-1)
  admin-service ────────►│   • sender mapping            │   configuration set:
  notification-service ─►│   • responsive dark templates │   baalvion-production
        ▲                │   • retry (no hard-bounce)    │
        │                │   • delivery logging (store)  │
  order-service ─────────┘   • SNS event handling        │
  payment-service          └──────────────┬───────────────┘
  (HTTP → notification)                   │
                                          ▼  delivery events
                          Amazon SNS  baalvion-ses-events
                                          │
                                          ▼  POST /webhooks/aws/ses
                              notification-service (verifies signature,
                              updates Redis delivery status)
```

**Sender mapping (chosen automatically by purpose):**

| Category        | From                        | Templates / use                                   |
|-----------------|-----------------------------|---------------------------------------------------|
| `auth`          | noreply@baalvion.com        | OTP, email verification, password reset, welcome  |
| `notifications` | notifications@baalvion.com  | order confirmation, newsletter, job/booking mail  |
| `security`      | security@baalvion.com       | login alert, security alert                       |
| `support`       | support@baalvion.com        | support reply                                     |
| `billing`       | billing@baalvion.com        | invoice, payment receipt, payout                  |
| `invrel`        | invrel@baalvion.com         | investor-relations mail                           |

Callers never pass a raw `From` address — the category determines the verified sender, so every
message leaves a verified identity and reputation stays partitioned.

---

## 2. Files

### Created — `Backend/packages/email/` (new shared package `@baalvion/email`)

| File | Purpose |
|------|---------|
| `package.json` | Plain CommonJS package; dep `@aws-sdk/client-sesv2` |
| `index.js` / `index.d.ts` | Barrel exports + TypeScript types |
| `src/config.js` | Env-driven config + `isSesConfigured()` (no hard-coded secrets) |
| `src/client.js` | SESv2 client factory + `SendEmailCommand` builder |
| `src/senders.js` | Category → verified sender resolution |
| `src/retry.js` | Transient-vs-permanent classifier; exponential backoff (never retries hard bounces) |
| `src/stores.js` | `NoopStore` (log-only) + `createRedisStore` (durable delivery status) |
| `src/EmailService.js` | DI service: `sendOTP / sendVerificationEmail / sendPasswordReset / sendWelcomeEmail / sendLoginAlert / sendSecurityAlert / sendOrderNotification / sendInvoice / sendSupportReply / sendNewsletter`, plus `sendRaw` |
| `src/templates/base.js` | Responsive, dark-mode-aware HTML shell |
| `src/templates/index.js` | 10 templates: otp, emailVerification, welcome, passwordReset, loginAlert, securityAlert, orderConfirmation, invoice, supportReply, newsletter |
| `src/sns.js` | SNS signature verification + SES event parsing + SubscriptionConfirmation |
| `test/*.test.mjs` | `node --test` suites (templates, service, SNS) |
| `README.md` | Package usage |

### Created — notification-service

| File | Purpose |
|------|---------|
| `service/sesMailer.js` | Adapter: wraps `@baalvion/email` with a Redis delivery-status store; SES sender selection per template |
| `routes/sesWebhook.js` | `POST /webhooks/aws/ses` — verifies signature, auto-confirms subscription, persists status |

### Modified

| File | Change |
|------|--------|
| `notification-service/service/emailService.js` | Provider chain now **SES → Resend → SMTP**; hard bounces are not failed-over |
| `notification-service/index.js` | Mounts `/webhooks/aws/ses`; health reports `ses` when active |
| `notification-service/config/validateConfig.js` | SES counts as a valid production provider |
| `notification-service/package.json` | + `@baalvion/email` |
| `auth-service/utils/mailer.js` | `sendMail` → SES (`auth` sender); `isMailerConfigured()` true when SES set |
| `auth-service/package.json` | + `@baalvion/email` |
| `law-service/service/mailer.js` | SES-first; per-template category (receipts/payouts → billing) |
| `proxy-service/service/mailer.js` | `sendMail` → SES-first |
| `proxy-service/utils/emailService.js` | OTP → `auth` sender, invitations → `notifications`; `isMailerConfigured()` includes SES |
| `jobs-service/workers/emailWorker.js` | Job emails → SES (`notifications`) |
| `admin-service/utils/mailer.js` | Staff mail → SES (`notifications`); SMTP retained as fallback |
| `law/proxy/jobs/admin/package.json` | + `@baalvion/email` |
| `.env.example` | Full SES configuration block |

`order-service` / `payment-service` were **not** changed — they already POST to
notification-service `/v1/notifications/email`, which now routes through SES.

---

## 3. Environment variables

```bash
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=…            # baalvion-ses-smtp access key  (or use instance role)
AWS_SECRET_ACCESS_KEY=…        # baalvion-ses-smtp secret key
# SES_USE_INSTANCE_ROLE=true   # alternative to static keys on EC2/ECS

SES_CONFIGURATION_SET=baalvion-production
SES_FROM_AUTH=noreply@baalvion.com
SES_FROM_NOTIFICATIONS=notifications@baalvion.com
SES_FROM_SECURITY=security@baalvion.com
SES_FROM_SUPPORT=support@baalvion.com
SES_FROM_BILLING=billing@baalvion.com
SES_FROM_INVREL=invrel@baalvion.com
SES_FROM_NAME=Baalvion
EMAIL_REPLY_TO=support@baalvion.com

# Optional tuning
# SES_MAX_ATTEMPTS=3  SES_RETRY_BASE_MS=500  SES_RETRY_MAX_MS=8000
# SES_WEBHOOK_VERIFY=true   (set false ONLY for local webhook testing)
```

**Secrets are read from the environment only — never committed.** The repo's secret-scanning push
protection stays in force; `.env*` remains git-ignored.

---

## 4. Migration notes

- **Backward compatible.** Every existing mailer keeps its function signature
  (`sendMail`, `sendMailSafe`, `sendOtpEmail`, `sendTemplate`, `isMailerConfigured`, …). SES is
  inserted as the preferred transport; the previous SMTP/Resend path remains as fallback.
- **No DB migration.** notification-service is Redis/BullMQ-based; delivery status is stored in
  Redis (`email:log:msg:<id>` hashes, 30-day TTL) — no SQL schema change.
- **Dev without AWS keys still runs.** When SES is unconfigured, sends fall back to SMTP/Mailpit or
  a dev console logger, and the service records the send as `skipped` rather than faking success.
- **Provider precedence:** SES → Resend → SMTP. A **permanent** SES failure (hard bounce / rejected
  recipient) is *not* failed over — the address is bad and retrying only harms reputation.
- **nodemailer** is intentionally retained in `package.json` files as the fallback transport; it is
  no longer the primary path once `AWS_ACCESS_KEY_ID` is set.

---

## 5. Deployment

1. **Set the env vars** (section 3) in the deployment environment for every email-sending service:
   auth-service, notification-service, proxy-service, law-service, jobs-service, admin-service.
   The same `AWS_*` + `SES_*` values apply to all.
2. **Install + build:**
   ```bash
   pnpm install
   pnpm run build           # @baalvion/email is no-build; this links it across the workspace
   ```
3. **Validate the catalog/architecture contract** (packages changed):
   ```bash
   pnpm run architecture:check
   ```
4. **Roll out** as usual (the consolidated image / CI → ECR → deploy). On boot,
   notification-service logs `email: ses` and `/health` reports `"email":"ses"`.
5. **Point SNS at the webhook.** The `baalvion-ses-events` SNS topic must have an HTTPS
   subscription to:
   ```
   https://<notification-service-public-host>/webhooks/aws/ses
   ```
   On first delivery the endpoint auto-confirms the subscription (signature-verified). See
   "Manual AWS steps" below.

---

## 6. Testing

### Unit (package)

```bash
cd Backend/packages/email
npm test          # node --test test/*.test.mjs
```

Covers: all 10 templates render + escape injection, correct sender per category, transient retry,
**no** retry on permanent failure, dev skip path, SNS event parsing, signature fail-closed (403),
and the cert-host SSRF allowlist.

### Integration (live SES sandbox/prod)

```bash
# With AWS_* + SES_* set, from a node REPL in any wired service:
node -e "require('@baalvion/email').createEmailService({logger:console})
  .sendOTP({to:'you@verified.com', code:'123456', expiresMinutes:5})
  .then(r=>console.log(r))"
```

In the SES **sandbox**, the recipient must also be a verified identity. Check delivery in the SES
console and the `email:log:recent` Redis stream.

### Webhook

```bash
# Simulate an SNS Delivery notification locally (verification disabled for the test only):
SES_WEBHOOK_VERIFY=false curl -X POST localhost:3031/webhooks/aws/ses \
  -H 'content-type: text/plain' \
  -d '{"Type":"Notification","Message":"{\"eventType\":\"Delivery\",\"mail\":{\"messageId\":\"abc\",\"destination\":[\"a@b.com\"]}}"}'
# → {"success":true,"action":"recorded","status":"delivered","messageId":"abc"}
```

In production leave `SES_WEBHOOK_VERIFY` unset (signature verification on).

---

## 7. Manual AWS steps still required

These cannot be done from the repo and are **not** automated here:

1. **Provide IAM credentials** for `baalvion-ses-smtp` to each service's environment
   (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) — or attach the equivalent instance/task role and
   set `SES_USE_INSTANCE_ROLE=true`.
2. **Subscribe the SNS topic to the webhook.** In SNS → `baalvion-ses-events` → Create
   subscription → Protocol **HTTPS** → Endpoint
   `https://<notification-service-host>/webhooks/aws/ses`. The service confirms automatically.
   Ensure the endpoint is publicly reachable (Caddy/ingress route to notification-service).
3. **Confirm the SES event destination** publishes the desired event types (Sends, Deliveries, Hard
   Bounces, Complaints, Rejects, Delivery Delays, Rendering Failures, Subscriptions) to that topic —
   already enabled per the current configuration.
4. **Move SES out of the sandbox** (if not already) via an AWS production-access request, so mail can
   be sent to arbitrary recipients (not only verified identities) and the higher sending quota applies.
5. **Verify the additional sender addresses / distribution groups** that aren't covered by the
   domain identity, if SES is configured to require per-address verification (support@, billing@,
   etc. are Zoho distribution groups — confirm they are accepted senders under the verified
   `baalvion.com` domain identity).
6. **DKIM / SPF / DMARC**: confirm the `baalvion.com` domain identity has DKIM enabled and DNS
   SPF/DMARC records in place for deliverability (one-time DNS setup).
