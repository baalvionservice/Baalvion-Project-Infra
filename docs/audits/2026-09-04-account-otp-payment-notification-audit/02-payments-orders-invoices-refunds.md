# Payment system, orders, reminders, subscriptions, invoices — per service

Covers checklist sections "Payment System", "Purchase/Order Notifications", "Payment Reminders", "Subscription System", "Invoice & Receipt". This platform is 20+ services, not one app — coverage varies enormously by service. Read [00-CRITICAL-SECURITY-FINDINGS.md](00-CRITICAL-SECURITY-FINDINGS.md) first; several of the gaps below are actual exploitable holes, not just missing features.

## Scorecard

| Service | Domain | Real gateway + signature-verified? | Idempotent? | Order/status notifications | Invoice/receipt | Subscriptions | Reminders |
|---|---|---|---|---|---|---|---|
| **order-service** | commerce | ✅ Razorpay/PayU, HMAC | ✅ DB unique index | ⚠️ only created+paid | ⚠️ table exists, never written | N/A | ❌ |
| **order-execution-service** | trade | ✅ multi-gateway, HMAC | ✅✅ best in repo (`processed_webhooks`) | ❌ outbox events defined, mostly unemitted | ❌ delegates to trade-documentation-service | N/A (one-shot trade orders) | ❌ |
| **trade-service** | commerce | ✅ HMAC (finance-events bridge) | ⚠️ in-memory Map only, not durable | ⚠️ PO events only, not payment/escrow | ❌ | N/A | ❌ |
| **trade-documentation-service** | trade | N/A (docs only) | N/A | N/A | ⚠️ invoice *metadata* + integrity hash, no real PDF, no S3 storage (stub) | N/A | N/A |
| **commerce-service** | commerce | ❌ none (reads settings only) | N/A | N/A | ❌ | N/A | ❌ |
| **inventory-service** | commerce | N/A by design (internal-key trust from order-service, not a PSP) | ✅ reservation lifecycle | ❌ | ❌ | N/A | ❌ |
| **ctm-service** | ecosystem | ✅ Stripe/Razorpay/PayU/Cashfree, all verified | ✅ status-transition guard | ❌ no dispatch | ⚠️ `pdf_url` column, never written | ⚠️ manual only, no auto-expire | ❌ |
| **brand-connector-service** | ecosystem | ❌ **no gateway at all** — see finding #5 | ❌ N/A | ❌ | ⚠️ `pdf_url` never written | ⚠️ manual only | ❌ |
| **giftcard-service** | ecosystem | ⚠️ delegated to central payment-service; local endpoint is shared-secret only | ✅ DB unique(provider, event_id) | ❌ | ❌ | N/A (one-off) | ❌ |
| **community-service** | ecosystem | ⚠️ same pattern as giftcard-service | ✅ DB unique(provider, event_id) | ❌ | ❌ | ⚠️ start only, `expires_at` never read/enforced | ❌ |
| **jobs-service** | ecosystem | ❌ no gateway — admin-only manual placement-fee ledger, no POST/create route at all | N/A (no webhook) | ❌ | ❌ | N/A | ❌ (interview-reminder copy exists in templates, never sent) |
| **insiders-service** | ecosystem | ⚠️ Razorpay real, PayU/Stripe/crypto **client-trusted** — see finding #4 | ⚠️ status short-circuit only, no webhook | ⚠️ success only | ❌ bare receipt ID string | ⚠️ start + upgrade only, `EliteSubscription` model unused/dead | ❌ (`expires_at` set, never read) |
| **mining-service** | ecosystem | ❌ N/A — plain status field, offline/escrow payment | N/A | N/A | N/A | N/A | N/A |
| **developer-service** | infrastructure | ✅ Razorpay, verified fail-closed | ⚠️ not directly confirmed | ✅ quota/key upgrade | ❌ | ⚠️ plan-slug upgrade only | ❌ |
| **proxy-service** | infrastructure | ✅ authoritative path solid; ⚠️ **legacy path weak and still live** — see findings #6 | ✅ authoritative path; ❌ legacy path (duplicate refunds) | ❌ notification worker is a stub (`console.log`+TODO) | ⚠️ plain-text receipt, not PDF, but properly access-gated | ⚠️ start/upgrade/cancel/grace, no pause/trial | ❌ |
| **admin-service** | platform | ❌ console over **seeded/fake** billing schema, not live | N/A | N/A | N/A (fake data) | N/A (fake data) | N/A |
| **dashboard-service** | platform | ❌ internal billing-record CRUD, no gateway | N/A | N/A | N/A (seeded display fields) | N/A | N/A |

---

## Commerce & trade domain

### order-service
Real backend-authoritative capture via 3 paths (client-confirm, Razorpay webhook, PayU return) — never client-trusted alone. Razorpay/generic webhooks HMAC-verified and fail-closed (`middleware/razorpayWebhookAuth.js:20-28`, `paymentWebhookAuth.js:20-33`); PayU verified via SHA-512 reverse hash (`paymentProvider.js:463-472`). Idempotent via a DB unique index `(order_id, transaction_id)` (`migrations/20260215-order-payment-idempotency.js`). Refunds (`orderService.js:705-759`) support full/partial with a dupe guard, but **no confirmation email is sent for refunds, failures, or cancellations** — only order-creation and payment-success emails exist. An `OrdersInvoice` model/table exists and is eager-loaded on order reads, but **nothing in the service ever creates a row in it** — schema present, feature unused. No subscription concept. No reminder/session-expiry job — only an internal reconciliation sweep that silently settles stale-pending payments without notifying the customer. Stripe has no dedicated webhook route at all; it relies purely on the client-initiated confirm call plus the reconciliation poll as a backstop.

### order-execution-service (trade domain — B2B trade-order saga)
The strongest webhook implementation found anywhere in the platform: a durable `processed_webhooks` table, dedup key derived only from the *signed* payload (never an unsigned header), duplicate insert caught as `SequelizeUniqueConstraintError` and mapped to a `200 {deduped:true}` no-op — all inside the same transaction as the order-state cascade. Every webhook path (RazorpayX settlement, Java finance-events bridge, PayU, Razorpay consumer-checkout) does real HMAC/signature verification. Weak spots: several lifecycle events (`PAYMENT_CONFIRMED`, `FAILED`, `state_changed`) are defined in the event catalog but **never actually emitted** — the real signal is a direct DB mutation, not an outbox event, so nothing downstream (like a notification) fires on payment confirmation. Refunds are almost entirely missing — `refundPayment()` exists on the gateway adapters but is never called from anywhere in the service; the only way an order reaches `refunded` status is reactively, from an inbound webhook. No session-expiry/reminder job. No subscriptions (correctly — this is a one-shot trade-order state machine). Invoice generation is correctly **not** duplicated here — it delegates to trade-documentation-service via the `gtos.order.created.v1` event.

### trade-service
Payments/escrow/wallets/orders were **retired as local write surfaces** (return `410 Gone`) and moved to a Java `financial-services-java` service; trade-service now holds read-only projections updated via a signed "finance-events" webhook (`controller/internalController.js`). That webhook is properly HMAC-verified (raw-body capture, `timingSafeEqual`, fails hard if the secret is unset in prod). Its idempotency, though, is only an **in-memory Map** (`SEEN_MAX=5000`, evicts oldest) — a process restart or running multiple pods loses the dedup cache entirely, and the code comment itself calls this "a dev bridge." No durable webhook-id table/unique constraint exists. Notification gap: escrow/payment state changes only `realtime.publish` — they never create a `Notification` row, even though a working notification pattern exists elsewhere in the same service for purchase-order events (`po_issued`/`po_accepted`/`po_rejected`). No reminders, no subscriptions, no invoice generation (a `commercial_invoice` concept exists but as an uploaded trade *document* type, not a system-generated payment invoice).

### trade-documentation-service
Not a payment processor — a documents/invoicing-adjacent service. `commercial_invoice` is a real doc type with a checksum-freeze integrity flow (SHA-256 hash on issue, locked from `draft`→`issued`). But there's no `payment_receipt`, `credit_note`, or tax-invoice doc type; the `/issue` endpoint doesn't actually render a PDF or any document body — it just hashes a JSON snapshot of existing DB fields and flips a status. S3 storage is a confirmed stub: the config exists (`DOC_BUCKET`/`S3_ENDPOINT`) but is never imported anywhere, there's no `aws-sdk` dependency, and the controller has an explicit `// TODO: persist snapshot to S3 ... WORM at V2` comment. E-signature is similarly shallow — a status flag plus an opaque client-supplied string, no real signing provider, no cryptographic link to the document's checksum. No payment notifications (out of scope by design — this service only reacts to order-created/inspection-completed events).

### commerce-service
No payment processing of its own — only a read-only `getPaymentSettings` passthrough (static `paymentMode`/`cryptoWallets` from store config) and a read-only "has this user paid" check used to gate verified-purchase reviews. No webhook route exists in this service at all.

### inventory-service
Deliberately payment-free by design — comments explicitly state stock is committed "WITHOUT payment." The `/confirm` reservation endpoint trusts a server-to-server internal key (`crypto.timingSafeEqual`-compared) from order-service's payment-capture path, which is a legitimate internal-trust pattern, not a payment-gateway webhook. Reservation idempotency (release/confirm no-ops on repeat calls) is real and tested.

## Ecosystem domain

### ctm-service ("Control The Market" — talent-challenge platform, companies pay for plans)
The most complete payment core outside order-execution-service: real HMAC/SDK verification for all four supported gateways (Stripe SDK constructEvent, Razorpay HMAC, Cashfree HMAC+timestamp window, PayU SHA-512), amount/currency integrity checks, and a status-transition dedupe guard. Gaps: no refund flow found; no email/notification actually dispatched on payment/subscription events (DB rows only); `invoices.pdf_url` exists but is never populated by any code; subscription lifecycle fields (`trial_ends_at`, `past_due`, `expired`) exist on the model but nothing auto-transitions them — all changes are manual API calls; no cron/scheduler exists anywhere in the service, so no reminders.

### brand-connector-service (influencer marketing — brands pay for plans)
See [critical finding #5](00-CRITICAL-SECURITY-FINDINGS.md) — there is no real payment gateway integration in this service at all.

### giftcard-service / community-service
Both are thin fulfillment clients of a central payment-service; the actual gateway integration lives upstream and wasn't in scope to re-audit here. Locally, both correctly enforce webhook idempotency via a DB `UNIQUE(provider, event_id)` constraint with real check-before-insert logic — genuinely solid. But their local `/billing/fulfill` callback is guarded only by a static shared secret, not a gateway signature (that check, if it exists, is upstream and wasn't visible from these services). Neither sends any order/purchase notification. Neither generates an invoice/receipt. giftcard-service's `'refunded'` status exists in the schema but is never set by any code path. community-service has a paid-membership `expires_at` field that is set on payment but **never read** — nothing auto-expires or warns about expiry, and there's no reminder job.

### jobs-service
Confirmed **not** a payment gateway or subscription surface — it's a manual, admin-only placement-fee ledger. The `Payment` model can only be status-transitioned (`PENDING_APPROVAL→APPROVED/PAID/REJECTED`) through an admin route; there is no create/initiate endpoint anywhere in the API, no gateway SDK, no webhook, no cron. `job_listings` has zero premium/featured/boost fields, so there's no monetized-listing product to audit either. One real gap: the email templates already contain interview-reminder copy (`workers/emailWorker.js:142`), but no scheduler exists to actually send it.

### insiders-service
See [critical finding #4](00-CRITICAL-SECURITY-FINDINGS.md). Two live payment paths are simultaneously mounted (a legacy `/functions/payment-*` set and a newer `/v1/billing/checkout` BFF that proxies to the Java payment-service) — a comment claims the new path "supersedes" the old one, but the old one isn't deprecated or removed, and it's the one with the client-trust bug. `EliteSubscription` model exists in the schema with zero controller references — a dead table. `Membership.expires_at` is set on purchase but nothing ever reads it.

### mining-service
Payment is genuinely out of scope for this service — `payment_status` is a plain manual field set by buyer/admin (`['unpaid','partial','paid','refunded']`), consistent with real-world trade happening offline (bank/escrow) outside the system. Not a gap, a correct design choice for this product.

## Infrastructure domain

### developer-service (self-serve API plan billing)
Real Razorpay integration: order creation, webhook-driven `payment.captured`/`order.paid` handling, signature verification that fails closed if the webhook secret is unset. Triggers a quota/API-key upgrade on success. No invoice generation, no reminders, and subscription handling is limited to a one-shot plan-slug upgrade rather than a full lifecycle. (A separate `eventRegistry.js` list of `payment.succeeded`/`invoice.paid` event names is just a catalog of *other* services' outbound webhook types, unrelated to this service's own billing.)

### proxy-service (Baalvion NetStack — the platform's most complete billing system, and its riskiest)
Read [critical findings #1, #2, #6](00-CRITICAL-SECURITY-FINDINGS.md) first. Setting those aside, the *authoritative* billing path (`billingWebhookController.js`, `webhookDedup.js`) is genuinely well built: HMAC verification for Razorpay/Stripe/PayU/Cashfree mounted before the JSON body parser (so raw bytes are preserved), timing-safe comparisons, and an atomic `INSERT ... ON CONFLICT DO NOTHING` against a real `payment_webhook_events` table. Subscriptions support start/upgrade/cancel plus `cancel_at_period_end`/`grace_until`, but no pause or trial state and no enum (status is free-text). Invoices are real DB rows properly access-gated by `billing:view` permission and ownership check — but the generated document is plain text, not a PDF. The one clean miss: `workers/notificationWorker.js`'s in-app/push handlers are literal stubs (`console.log` + `// TODO`) — internal billing events fire, but nobody actually gets notified of a plan change, cancellation, or payment failure. No reminder job for due/overdue/expiring anywhere in the scheduler.

## Platform domain

### admin-service
Its `billing` schema (transactions/subscriptions/invoices/refunds/webhook_logs) is explicitly **seeded with `Math.random()` fake data** (`scripts/bootstrapPayments.js`) — confirmed synthetic demo data for the admin console, not live payment records. "Refund"/"retry webhook" admin actions only write to this local fake schema; there's no outbound call to any real gateway and no signature verification anywhere in the service.

### dashboard-service
Internal billing-record CRUD (cap-table/finance-tracker style) — organizations can `PATCH` their own plan/billing-cycle/contact fields directly in Postgres. No gateway call, no webhook route, no signature check anywhere. `invoiceNumber`/`paymentDate`/`paymentMethod` are seeded/display fields, not live transaction data.
