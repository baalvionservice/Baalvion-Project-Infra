# Baalvion Email Architecture

Authoritative architecture reference for the centralized email subsystem owned by
**`@baalvion/email`** (Amazon SES, AWS SDK v3 / SESv2). Companion to the operational guide in
[SES-EMAIL-INTEGRATION.md](./SES-EMAIL-INTEGRATION.md).

- **Provider:** Amazon SES (SESv2 `SendEmail`)
- **Region:** `ap-south-1`
- **Configuration set:** `baalvion-production` (attached to every send)
- **Verified domain:** `baalvion.com`
- **Event topic:** SNS `baalvion-ses-events` → `POST /webhooks/aws/ses`

---

## 1. Email flow diagram

```
 ┌─ auth-service ──────┐   sendOTP / verify / reset / welcome
 ┌─ proxy-service ─────┤   OTP, invitations
 ┌─ law-service ───────┤   booking, receipts, payouts
 ┌─ jobs-service ──────┤   application / interview lifecycle
 ┌─ admin-service ─────┤   staff invites, onboarding
 ┌─ notification-svc ──┤   platform notifications (orders, alerts, newsletter)
 │  (order/payment ────┘   POST /v1/notifications/email → notification-service)
 │
 ▼  createEmailService({ logger, store })
┌───────────────────────── @baalvion/email ─────────────────────────┐
│  EmailService._send(template) / .sendRaw({category})              │
│    1. categoryOf(template)         → auth|notifications|security…  │
│    2. resolveSender(config, cat)   → verified From (never caller)  │
│    3. render(template)             → {subject, html, text}         │
│    4. buildSendCommand             → ConfigurationSet + EmailTags  │
│    5. withRetry(() => ses.send())  → transient-only backoff        │
│    6. store.record(entry)          → recipient/sender/status/msgId │
└───────────────────────────────┬───────────────────────────────────┘
                                 ▼  SESv2 SendEmail  (ap-south-1)
                          ┌──────────────┐
                          │  Amazon SES  │  configuration set: baalvion-production
                          └──────┬───────┘
                                 ▼  Send/Delivery/Bounce/Complaint/Reject/Delay/RenderFail
                          SNS  baalvion-ses-events
                                 ▼  POST /webhooks/aws/ses  (text/plain, raw bytes)
                  notification-service → @baalvion/email handleSnsRequest
                     • verify SNS signature (fail-closed, host-allowlisted cert)
                     • auto-confirm SubscriptionConfirmation
                     • parseSesEvent → store.updateStatus(messageId, status)
                                 ▼
                          Redis  email:log:msg:<messageId>  (status, 30-day TTL)
                                 email:log:recent  (capped activity stream)
```

**Fallback transports (only when SES is not configured — dev / outage):** SES → Resend →
SMTP (notification-service); SES → SMTP/Mailpit/Ethereal (other services). A **permanent** SES
failure (hard bounce / rejected recipient) is never failed over.

---

## 2. Sender mapping

Callers never supply a `From` address. The method (or `category`) selects the verified sender, so
sender reputation stays partitioned by purpose.

| Category        | Verified sender              | Used for                                                 |
|-----------------|------------------------------|----------------------------------------------------------|
| `auth`          | `noreply@baalvion.com`       | OTP, email verification, password reset, welcome         |
| `notifications` | `notifications@baalvion.com` | order confirmation, newsletter, job & booking mail       |
| `security`      | `security@baalvion.com`      | login alert, security alert, MFA, impersonation alert    |
| `support`       | `support@baalvion.com`       | support replies (also the platform `Reply-To`)           |
| `billing`       | `billing@baalvion.com`       | invoices, payment receipts, payouts                      |
| `invrel`        | `invrel@baalvion.com`        | investor-relations mail                                  |

Each address is overridable via `SES_FROM_<CATEGORY>` env, defaulting to the values above. The
display name (`SES_FROM_NAME`, default `Baalvion`) is quoted defensively; the address always comes
from the category, so an arbitrary `From` can never be injected.

---

## 3. Template inventory

Ten responsive, dark-mode-aware templates ship in `src/templates/index.js`; every interpolated
value is HTML-escaped, and each emits a plain-text alternative.

| # | Template            | Category        | Purpose                          |
|---|---------------------|-----------------|----------------------------------|
| 1 | `otp`               | `auth`          | one-time passcode                |
| 2 | `emailVerification` | `auth`          | email confirmation link          |
| 3 | `welcome`           | `auth`          | account-ready welcome            |
| 4 | `passwordReset`     | `auth`          | reset link                       |
| 5 | `loginAlert`        | `security`      | new sign-in notice               |
| 6 | `securityAlert`     | `security`      | high-risk / suspicious activity  |
| 7 | `orderConfirmation` | `notifications` | order receipt with line items    |
| 8 | `invoice`           | `billing`       | invoice with line items          |
| 9 | `supportReply`      | `support`       | threaded support reply           |
| 10| `newsletter`        | `notifications` | broadcast + unsubscribe footer   |

Services that own their own templates (auth/proxy/law/jobs/admin) send already-rendered HTML via
`sendRaw({ category })` rather than re-templating.

### Cross-client rendering strategy

- **Inline styles** back every critical color/layout property (Gmail strips `<style>` in some
  contexts); the `<style>` block then *enhances* with dark mode and hover.
- **Dark mode** via `color-scheme` meta + `@media (prefers-color-scheme: dark)`; neutral
  high-contrast defaults keep clients that honor neither legible (Apple Mail/iOS adapt; Gmail
  applies its own inversion).
- **Responsive** `max-width:600px` container with a `@media (max-width:480px)` mobile block.
- **Outlook (Windows/Word engine):** MSO `PixelsPerInch` comment is present; line-item layouts use
  real `<table>`. Known limitation — `border-radius`/`box-shadow` degrade (square, no shadow) and
  `div` `max-width` is not width-constrained. See findings for the optional MSO ghost-table fix.

> Static analysis confirms the markup follows cross-client best practice. True pixel rendering
> across Gmail / Outlook / Apple Mail should be confirmed with a Litmus / Email-on-Acid pass before
> high-volume campaigns (not required for transactional go-live).

---

## 4. SNS event flow

1. SES publishes events (Send, Delivery, Bounce, Complaint, Reject, DeliveryDelay, Rendering
   Failure, Subscription) to SNS `baalvion-ses-events`.
2. SNS `POST`s to `/webhooks/aws/ses`. The route reads the **raw text body** (SNS signs the exact
   bytes; a re-serialized body would fail verification) with a 256 kB cap.
3. `handleSnsRequest` (in `@baalvion/email`):
   - **Verifies the SNS signature** cryptographically (RSA-SHA1/SHA256 over the canonical fields).
     The signing cert is fetched only from `^sns\.[a-z0-9-]+\.amazonaws\.com$` over HTTPS (SSRF
     guard), size- and timeout-bounded, then cached. **Fail-closed:** any verification failure →
     `403`. Disable only via explicit `SES_WEBHOOK_VERIFY=false` (local testing).
   - **SubscriptionConfirmation:** auto-confirms by GETting the host-allowlisted `SubscribeURL`.
   - **Notification:** `parseSesEvent` normalizes to `{ eventType, status, messageId, recipients,
     detail }` and calls `store.updateStatus(messageId, status, detail)`.
4. Webhook always returns `200` on successful processing so SNS does not redrive a handled message.

---

## 5. Retry flow

```
ses.send(cmd)
  └─ withRetry (maxAttempts=3, base=500ms, max=8000ms, full jitter)
        ├─ isTransient(err)?
        │     PERMANENT  → throw immediately (no retry)
        │       MessageRejected, MailFromDomainNotVerified, AccountSuspended,
        │       SendingPaused, BadRequest, NotFound, LimitExceeded, 4xx
        │     TRANSIENT  → backoff & retry
        │       Throttling, TooManyRequests, RequestTimeout, ServiceUnavailable,
        │       InternalServiceError, ECONNRESET/REFUSED, ETIMEDOUT, EPIPE,
        │       429, 5xx, $retryable
        └─ attempts exhausted → throw last error
```

- Tunable via `SES_MAX_ATTEMPTS`, `SES_RETRY_BASE_MS`, `SES_RETRY_MAX_MS`.
- A **final transient** error is rethrown so a BullMQ queue can re-drive the job; a **permanent**
  error is recorded as `failed` and swallowed so one bad address never poisons a batch or burns
  the sending quota / reputation.

---

## 6. Failure handling

| Event / failure            | Classification | Send behavior                              | Status recorded   |
|----------------------------|----------------|--------------------------------------------|-------------------|
| Throttling / 5xx / network | transient      | retried with backoff; rethrow if exhausted | `sent` or `failed`|
| `MessageRejected` / 4xx    | permanent      | no retry, no failover                      | `failed`          |
| Hard bounce (Permanent)    | permanent      | future sends rejected by SES suppression¹  | `bounced`         |
| Soft bounce (Transient)    | transient      | SES retries internally; no local suppress  | `bounced`         |
| Complaint                  | permanent      | SES suppresses; address flagged¹           | `complained`      |
| Reject (virus/content)     | permanent      | no retry                                   | `rejected`        |
| DeliveryDelay              | transient      | informational                              | `delayed`         |
| Rendering Failure          | config error   | informational (template/tag issue)         | `rendering_failed`|
| SES not configured (dev)   | n/a            | no-op; logged loudly                       | `skipped`         |

¹ **Hard-bounce / complaint suppression is enforced at the SES account level** (SES adds the
address to its suppression list and returns `MessageRejected` on subsequent sends, which the retry
classifier treats as permanent — no retry, no failover). The webhook records `hardBounce: true` but
the platform does **not** maintain its own pre-send suppression list. See findings.

### Webhook idempotency

Delivery-status persistence is **idempotent by construction**: `updateStatus` performs a Redis
`HSET` (last-write-wins) keyed by the SES `messageId`. A duplicate SNS event for the same message
re-writes identical fields — it cannot double-count, append, or create a duplicate record. The
notification-service additionally dedupes **outbound** sends with a Redis `SET … NX` on
`idempotencyKey` (24 h). Note: status writes are not monotonically ordered, so a late, out-of-order
event could momentarily regress a status; this does not cause duplicate updates.

---

## 7. Deployment checklist

**Code / config (in-repo):**

- [ ] `pnpm install` (links `@baalvion/email` across the workspace)
- [ ] `pnpm run architecture:check` green (catalog/contract)
- [ ] `@baalvion/email` unit tests green (`cd Backend/packages/email && npm test`)
- [ ] Env set for every sender service (auth, notification, proxy, law, jobs, admin):
      `AWS_REGION=ap-south-1`, credentials (or `SES_USE_INSTANCE_ROLE=true`),
      `SES_CONFIGURATION_SET=baalvion-production`, `SES_FROM_*`, `EMAIL_REPLY_TO`
- [ ] `SES_WEBHOOK_VERIFY` unset/true in production
- [ ] notification-service boots logging `email: ses`; `/health` reports `"email":"ses"`

**Manual AWS (cannot be automated from the repo):**

- [ ] Provide `baalvion-ses-smtp` IAM credentials (or attach instance/task role)
- [ ] SNS `baalvion-ses-events` → HTTPS subscription to
      `https://<notification-host>/webhooks/aws/ses` (auto-confirms on first delivery)
- [ ] Confirm the SES configuration set publishes all event types to the topic
- [ ] **Move SES out of the sandbox** (production-access request) for arbitrary recipients
- [ ] Verify `support@` / `billing@` / `invrel@` senders are accepted under the domain identity
- [ ] Confirm DKIM enabled + SPF/DMARC DNS records for `baalvion.com`
- [ ] Confirm SES **account-level suppression list is enabled** for bounces + complaints
      (this is the suppression mechanism — see §6)
- [ ] Ensure the webhook host is publicly reachable via Caddy/ingress

---

## 8. Security properties

- **No hard-coded secrets.** Credentials resolve from env or the ambient AWS credential chain;
  `.env*` is git-ignored and push-protection is on.
- **Sender integrity.** Category → verified sender; arbitrary `From` cannot be injected. The display
  name is stripped of quotes/CR/LF.
- **SNS signature is fail-closed.** Forged events are rejected (`403`); the cert fetch is restricted
  to an AWS host allowlist over HTTPS with size/timeout bounds (SSRF guard).
- **Log hygiene.** No AWS keys or secrets are logged; recipient addresses are CR/LF-stripped before
  logging (CWE-117 log-injection guard) on the auth/proxy paths.
- **Template injection.** All interpolated values are HTML-escaped at render time.
- **SES message tags** are sanitized to `[A-Za-z0-9_-]` so a stray template name cannot fail a send.
