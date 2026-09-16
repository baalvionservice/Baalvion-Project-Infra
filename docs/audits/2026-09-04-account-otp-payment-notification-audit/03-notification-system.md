# Central notification system, admin alerting, email templates

Covers checklist sections "Admin Notifications", "Notification System" (the `notification_events` central-dispatch idea), and "Email System" (templates). Primary service: `Backend/services/infrastructure/notification-service`. Underlying transport: `Backend/packages/email` (Amazon SES — already audited separately as sound; see the mail/OTP summary earlier in this conversation).

## Is there a real central dispatch system? Yes — but it isn't actually central

**What's genuinely good:**
- `service/dispatchService.js` is a real channel-fan-out engine — infers/accepts channel (email/sms/push/in-app), honors per-user opt-outs, queues per channel. Reachable via `POST /v1/notifications/dispatch`.
- **Queue/worker architecture**: BullMQ + Redis, 5 named queues (`email`, `webhook`, `sms`, `push`, `notification`), each with its own `Queue`+`Worker` pair, fed by a Redis Streams event consumer (`workers/eventConsumer.js`) using `XREADGROUP`/`XAUTOCLAIM` for at-least-once delivery, deduped via `notif:processed:<eventId>` plus BullMQ's own `jobId` dedup.
- **Retry handling**: layered — BullMQ per-queue retries with exponential backoff (email: 4 attempts/5s, webhook: 5/10s, sms: 4/5s, push: 3/4s) plus SES-level retry classification (transient vs. permanent — never retries a hard bounce). Jobs that exhaust retries land in a Redis-Streams dead-letter queue, viewable and retryable by admins via `GET/POST /v1/notifications/queues/dlq*`.

**What's not actually central:**
- There's no single enum of business event types like `USER_REGISTERED`/`PAYMENT_SUCCESS`/`ORDER_CREATED`. What exists is a hardcoded `switch` in `workers/eventConsumer.js` handling specific inbound event names (`auth.registered`, `auth.email_verification_requested`, `auth.password_reset_requested`, `session.high_risk`, `auth.new_device_login`, `auth.invitation_created`, `auth.mfa_enabled`, `admin.impersonation_started`, plus generic `cms.*`/`payment.*` pass-through). Payment events (`payment.created/authorized/captured/failed/refunded`) fall into a **generic handler that only fans to in-app** — no email template is wired to any of them.
- **At least 7 other services bypass notification-service entirely** and call `@baalvion/email` directly with their own hand-rolled mailer wrappers: `auth-service`, `admin-service`, `marketplace-service`, `law-service`, `cms-service`, `jobs-service`, `proxy-service`. For example, auth-service's email-OTP login sends straight through the shared email package, never touching notification-service. The `@baalvion/email` package's own README admits the platform previously had "six divergent mail implementations" — that package unified the *transport*, but did not unify *orchestration* through notification-service.
- **Delivery logging is Redis-only, not durable.** `@baalvion/email`'s Redis store writes a per-message hash with a 30-day TTL plus a capped activity stream — there is no SQL `notification_logs`/`email_logs` table anywhere. notification-service's own README states it explicitly: "This service is stateless — it owns no SQL schema... no migrations." After 30 days (or a Redis flush), there's no record a given email was ever sent.

## Admin/ops notifications — fragmented, not a real feature

Checked the whole `Backend/services` tree for admin-alert wiring on the events the checklist calls out:

| Event | Admin gets alerted? |
|---|---|
| New user signup | ❌ Only the *user's* welcome email fires |
| New purchase / payment success / payment failed | ❌ `payment.*` events fan to the paying user's in-app feed only, never to ops |
| Refund request / completed | ❌ No handler anywhere |
| Payment dispute / chargeback | ❌ trade-service/proxy-service model chargebacks in their own DBs but don't alert notification-service |
| Subscription cancellation / failed recurring payment | ❌ proxy-service handles `subscription.cancelled` webhooks but only updates DB status — no alert |
| Suspicious activity | ⚠️ Exists, but only inside **proxy-service's own isolated** `service/alertService.js` (fans to org in-app + optional Slack/Discord/webhook/email) — unrelated to the platform's shared notification-service |
| Large/high-value transaction | ⚠️ Feeds a compliance risk-score in trade-service only (`aiAnalyzer.js`, `kycAml.js`) — no alert dispatch |
| System error / delivery failure | ✅ The one real example: `order-service/service/alerts.js` posts to notification-service's `/dispatch` (in-app + optional email to a configured ops address) on reconciliation drift / ledger or inventory unavailability. Order-service-specific, not a platform feature |

**Net finding:** there is no unified "admin gets notified when X happens" layer. What exists is two independent, service-specific alerting systems (order-service's ops alerts, proxy-service's abuse/billing alertService) built separately rather than one shared admin-notification feature.

## Email template coverage (`notification-service/templates/`)

| Template | Status |
|---|---|
| Welcome | ✅ via the premium brand-themed renderer (a duplicate plain-layout `welcome` entry also existed in `TEMPLATES` but was dead/unreachable code — **removed 2026-09-04**) |
| OTP | ❌ Not here — exists only in `@baalvion/email`'s own template set, used directly by auth-service, bypassing this service entirely |
| Password reset | ✅ |
| Account/email verification | ✅ |
| Login alert | ✅ |
| Purchase confirmation | ✅ |
| Payment successful | ✅ |
| Payment failed | ✅ **Built 2026-09-04** (`paymentFailed`) — template exists and is tested, but see note below |
| Payment reminder | ✅ **Built 2026-09-04** (`paymentReminder`) — template exists and is tested, but see note below |
| Invoice | ✅ **Built 2026-09-04** (`invoice`, reuses the same items-table markup as `orderConfirmation`/`orderPaid`) — template exists and is tested, but see note below |
| Refund | ✅ **Built 2026-09-04** (`paymentRefunded`) — template exists and is tested, but see note below |
| Subscription renewal | ✅ **Built 2026-09-04** (`subscriptionRenewal`) — template exists and is tested, but see note below |
| Subscription expiry | ✅ **Built 2026-09-04** (`subscriptionExpiry`, one template covers both the "expiring soon" and "already expired" states via a boolean flag) — template exists and is tested, but see note below |
| Account security alert | ✅ |

**Important caveat on the 6 templates built 2026-09-04:** these are dry-run render-tested (`test/templates.test.js`, 20 tests, all passing — confirms correct Handlebars interpolation, loops, conditional states, and HTML-escaping) but are **not wired to fire automatically**. `eventConsumer.js`'s `payment.failed`/`payment.refunded` cases still only produce an in-app notification via `handleDomainEvent` (see above) — they were deliberately not switched over to send these new templates because no service in the platform currently publishes `payment.*`/subscription-lifecycle events onto the shared `baalvion:events` bus with a known, real payload shape (confirmed by grep — the only real producers use differently-named events on a separate bus, e.g. proxy-service's `billing.payment.succeeded`/`billing.payment.failed`). Wiring these templates to fire for real requires first getting the relevant services (order-service, ctm-service, proxy-service, etc.) to actually publish matching events — a separate, larger integration task, not assumed or guessed at here to avoid shipping a handler with fabricated field names that silently breaks (e.g. sending to `undefined`) the moment a real producer shows up.

Templates beyond the checklist also exist: org invite, MFA-enabled, impersonation alert, plus a premium-brand lifecycle set (onboarding day-1/3/7, re-engagement, lead notification).

## Key files

`notification-service/{README.md, platform/events.js, workers/eventConsumer.js, service/dispatchService.js, service/emailService.js, service/sesMailer.js, queue/queues.js, templates/index.js, templates/premium/index.js, controller/notificationController.js}`; `Backend/packages/email/{README.md, src/stores.js, src/retry.js, src/templates/index.js}`; `order-service/service/{alerts.js, orderNotifications.js}`; `proxy-service/service/alertService.js`.
