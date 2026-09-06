# Database design, scheduled jobs, payment-webhook idempotency

Covers checklist sections "Database Design", "Scheduled/Automatic Jobs", and the idempotency half of "Payment Webhooks". ORM is Sequelize platform-wide (39 `package.json` hits; zero Prisma/Knex found in `Backend/services`).

## Scheduled / automatic jobs

Every service that runs periodic work uses **BullMQ's `repeat:` option**, not `node-cron`/`agenda` — no `cron.schedule(` call exists anywhere in the tree, despite several services declaring cron-adjacent packages.

| Service | Real periodic job(s) | Notes |
|---|---|---|
| trade-service | verification monitor (6h), freight carrier performance refresh (24h), ETA-predict sweep (1h), delay sweep (1h) | |
| order-service | ledger reconciliation sweep (hourly default); "pending/paid-but-pending gateway" sweep (10 min default) | **The pending-payment sweep is disabled by default** (`RECONCILE_GATEWAY_ENABLED=false`) |
| news-service | content-ingestion poll | |
| cms-service | hourly analytics rollup, daily analytics maintenance, per-website analytics sync | |
| proxy-service | Real cron-equivalent work, but hand-rolled via `setInterval` rather than BullMQ despite BullMQ being declared: dest-intel refresh (6h), mod-queue gauge (1min), hourly scheduler driving monthly billing (idempotent via a `billing_runs` table), daily GDPR retention sweep, provider-cost reconciliation, credit expiry, payout processing, ASN reputation refresh, SLA/SIEM export | Most mature scheduler in the platform |
| commerce-service | ❌ None — only one-off delayed jobs for scheduled product publish | Cron dependency present but unused for recurring work |
| jobs-service | ❌ None — all 4 queues (email/scoring/indexing/resume) are purely on-demand | No interview-reminder sweep despite reminder copy existing in templates |
| notification-service | ❌ None — purely event/consumer-driven, retries are per-job not a sweep | |

**Platform-wide gap:** no service runs a "check pending payments," "send payment reminders," "check expiring subscriptions," or "cleanup expired OTPs/sessions" job — the checklist's example schedule (every-few-minutes / hourly / daily sweep) doesn't exist as a general pattern anywhere; each service that needs recurring work built its own narrow version, and several (commerce-service's product-publish delay, order-service's disabled-by-default sweep) are effectively dead or off.

## Payment-webhook idempotency (excluding outbound/customer-configured webhooks, which are a different feature)

| Endpoint | Signature verified | Idempotent |
|---|---|---|
| order-service `/orders/webhooks/razorpay`, `/payu` | ✅ HMAC / SHA-512, fail-closed | ✅ order-row lock + status short-circuit + amount/currency check |
| ctm-service `/payments/webhook` (Stripe/Razorpay/Cashfree) | ✅ per-provider, all real | ✅ status-transition guard + amount/currency check |
| order-execution-service `/webhooks/razorpay` (RazorpayX settlement) | ✅ HMAC | ✅✅ **best implementation found** — durable `processed_webhooks` inbox table, dedup key derived only from the signed payload |
| law-service `/v1/payments/webhook` | ✅ HMAC, fail-closed | ⚠️ ledger credit is deduped, but the **receipt email is re-sent on every redelivery** — no send-once guard |
| imperialpedia-service `/payments/webhook` | ✅ | ✅ same status-transition pattern as ctm-service |
| proxy-service **legacy** `/v1/payment/webhook/*` | ⚠️ weak (see [critical finding #6](00-CRITICAL-SECURITY-FINDINGS.md)) | ❌ **no dedupe — creates a duplicate refund row on every replay** |
| proxy-service **authoritative** `/v1/billing/webhook/*` | ✅✅ timing-safe HMAC, raw body preserved | ✅✅ durable `payment_webhook_events` table, atomic `INSERT ... ON CONFLICT DO NOTHING` |
| giftcard-service / community-service `/billing/fulfill` | ⚠️ shared-secret only locally (real gateway check, if any, is upstream in a central payment-service) | ✅ DB `UNIQUE(provider, event_id)`, real check-before-insert |
| trade-service finance-events bridge | ✅ HMAC, raw body, fails hard if unset | ⚠️ **in-memory Map only** — lost on restart/scale-out, not a durable constraint |

## Database design — checklist's idealized schema vs. reality

The checklist assumes one app with one schema; this platform is 20+ services each owning their own Postgres schema, so table names differ per service. What's actually present or missing as a *concept*, anywhere in the platform:

| Concept | Status |
|---|---|
| users | ✅ `auth-service/models/users.js` |
| user_sessions | ✅ `auth-service/models/sessions.js`, dedicated `session-service` |
| user_devices | ❌ **Not found anywhere** |
| otp_codes | ✅ split into `emailOtps`/`phoneOtps` |
| password_reset_tokens | ✅ `auth-service/models/passwordResets.js` |
| products / plans | ✅ widespread (commerce-service, ctm-, imperialpedia-, brand-connector-, proxy-service) |
| orders / order_items | ✅ `order-service/models/ordersOrder.js`, `ordersOrderItem.js` |
| payments / payment_transactions | ✅ `ordersOrderPayment.js`; `transactions.js` in proxy-, dashboard-service |
| payment_webhooks | ✅ 3 real implementations — proxy-service `payment_webhook_events`, order-execution-service `processed_webhooks`, and a Java migration in `financial-services-java` |
| subscriptions | ✅ widespread — ctm-, law-, imperialpedia-, brand-connector-, proxy- (`billing_subscriptions`), ir-service (`ir_subscriptions`) |
| subscription_payments | ⚠️ Merged, not a dedicated join table — payment rows just carry a `subscription_id` FK |
| invoices | ✅ `order-service/models/ordersInvoice.js` (unused — see file 02), ctm-service `db.invoices` |
| **refunds** | ❌ **No persisted refund table anywhere in the platform.** Refunds are fire-and-forget gateway API calls (`createRazorpayRefund`/`createPayuRefund`). Closest analog is order-service's `ordersReturn`/`ordersReturnItem` — that's a merchandise-return workflow, not a financial refund ledger |
| notifications | ✅ widespread — jobs-, ctm-, brand-connector-, trade-, dashboard-, law-, proxy-service, ir-service |
| notification_templates | ⚠️ File-based (`templates/*.js`), not a DB table |
| **notification_logs / email_logs / sms_logs** | ❌ **Not found anywhere.** notification-service — the platform's central dispatcher — has no `models/` directory at all; it's a pure stateless queue relay with zero SQL persistence, so there is no durable, queryable delivery-audit trail platform-wide (Redis-only, 30-day TTL — see file 03) |
| audit_logs | ✅ widespread and, in `audit-service`, genuinely strong — see file 05 |
