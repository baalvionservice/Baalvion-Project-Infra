# Critical security findings — read this file first

These were found while auditing account/OTP/payment/notification coverage (see [README.md](README.md)). They are not checklist gaps — they are live, exploitable issues in code that is presumably deployed. Prioritize these over the completeness checklist.

---

## 1. HIGH — proxy-service password reset has no token check (account takeover)

**Service:** `Backend/services/infrastructure/proxy-service`
**Where:** `routes/authRoutes.js:18` (`resetPassword`), backed by `validators/schemas.js:32` (schema is just `{ email, newPassword }` — no token/OTP field at all).

`resetPassword` accepts only an email address and a new password. There is no reset token, no OTP, nothing tying the request to proof of mailbox ownership. **Anyone who knows a customer's email address can set their password and log in as them.**

Compare with `forgotPassword` (`service/authService.js:129-140`), which doesn't even email a token to begin with — it just logs an internal notification. So the "forgot password" flow on this service is broken end-to-end: no token is issued, and none is required to complete a reset.

**Fix direction:** Mint a single-use, expiring reset token on `forgotPassword` (mirroring `auth-service`'s real implementation — see [02](02-account-otp-credentials.md)), email it, and require it in `resetPassword` before allowing the password change.

---

## 2. HIGH — `verifyEmail` also has no token (proxy-service)

**Service:** `Backend/services/infrastructure/proxy-service`
**Where:** `validators/schemas.js:33` — `verifyEmail` schema is just `{ email }`.

Same shape of bug as #1: anyone can call this endpoint with an arbitrary email address and have it marked verified, with no proof they control that mailbox.

---

## 3. HIGH — plaintext hardcoded default password for admin-invited users (proxy-service)

**Service:** `Backend/services/infrastructure/proxy-service`
**Where:** `service/userService.js:79`, inside `inviteUser()`.

When an admin creates a user without supplying a password, the account is created with a hardcoded literal password: `'InviteOnly123!'`. Every such account shares the same password until (if ever) changed. There's also no "account created" email actually sent — `user.invited` is emitted on `eventBus.js` (a bare in-process `EventEmitter`), but nothing subscribes to it to notify the user, so the account may sit with a public, guessable password and nobody told.

**Fix direction:** Never set a real password on admin-created accounts — issue a single-use activation/password-creation link instead (this is exactly the pattern `auth-service`'s `teamService.issueInvitation` already does correctly — see [02](02-account-otp-credentials.md)).

---

## 4. HIGH — insiders-service trusts client-supplied payment status for PayU/Stripe/crypto

**Service:** `Backend/services/ecosystem/insiders-service`
**Where:** `controller/functionsController.js:284-306` (`paymentConfirm`) calling `provider.verify(payload)`, where `payload` is POSTed directly by the client. Provider implementations: `payments/index.js:53-57` (payu), `:71-75` (stripe), `:88-92` (crypto) — each just reads fields off the client-supplied object (e.g. `payload.status`) with no signature/HMAC check. `config/appConfig.js:47,49,50` define `webhookSecret` keys for these providers but nothing in the service ever reads them.

Only the Razorpay path (`payments/index.js:30-37`) does a real HMAC check. For the other three providers, a logged-in user can call `paymentConfirm` with a self-constructed payload claiming their payment succeeded, and the service will accept it — no gateway ever actually confirmed the charge.

**Fix direction:** Replace `paymentConfirm`'s trust-the-client-payload model with real gateway webhooks (signature-verified, server-to-server) for every provider, the same way Razorpay already works here and the way `order-service`/`ctm-service`/`order-execution-service` do it correctly (see [03](03-payments-orders-invoices-refunds.md)).

---

## 5. HIGH — brand-connector-service payment/subscription flow has no gateway at all

**Service:** `Backend/services/ecosystem/brand-connector-service`
**Where:** `controller/paymentController.js:60-68` (`markPaid`), `controller/billingController.js:48-77` (`subscribe`).

`markPaid` flips a payment row straight to `paid` using a client-supplied `method` and a locally generated `transaction_id` (`uuidv4()`) — there is no call to any payment gateway anywhere in this service (confirmed: zero Stripe/Razorpay/HMAC/webhook references in the whole service). `subscribe` similarly activates a paid subscription with zero payment step. **Any authenticated org member can mark their own invoice/subscription as paid with no money ever moving.**

**Fix direction:** If this product handles real transactions, it needs an actual gateway integration before `markPaid`/`subscribe` can be trusted for anything beyond a demo/sandbox environment.

---

## 6. MEDIUM-HIGH — proxy-service runs two payment-webhook systems in parallel; the old one is still live and double-processes refunds

**Service:** `Backend/services/infrastructure/proxy-service`
**Where:** Legacy path — `routes/paymentRoutes.js:28,46,53` → `controller/paymentController.js:176-291`. Authoritative path — `index.js:27-59` (raw body mounted pre-JSON-parser) → `controller/billingWebhookController.js`.

There's a properly built webhook system (`service/webhookDedup.js`, `payment_webhook_events` table, `INSERT ... ON CONFLICT DO NOTHING`, timing-safe HMAC) — but an older, weaker webhook route set is still mounted and reachable at the same time:

- The Razorpay leg re-serializes the body via `JSON.stringify(req.body)` instead of using the captured raw bytes (`paymentController.js:178`), and compares signatures with plain `===` instead of `crypto.timingSafeEqual` (`razorpayService.js:108`).
- The generic `/v1/payment/webhook/:provider` route (`paymentRoutes.js:53`) has no raw-body capture at all before the JSON body parser runs.
- None of the legacy handlers check any dedupe table. Most updates are harmless-on-replay (they just set a status to the same value again), **except `refund.created`, which unconditionally does `models.transactions.create(...)` on every delivery** (`razorpayService.js:174`) — a webhook redelivery (which all gateways do on retry/timeout) creates a duplicate refund transaction row each time.

**Fix direction:** Remove or hard-disable the legacy `/v1/payment/webhook/*` routes now that the authoritative `/v1/billing/webhook/*` path exists, or at minimum add the same dedupe-table check to the legacy `refund.created` handler.

---

## Not urgent, but worth knowing

- **No refunds ledger exists anywhere in the platform.** Refunds are fire-and-forget calls to the gateway's refund API (`createRazorpayRefund`/`createPayuRefund` etc.) with no persisted `refunds` table tracking amount, status, or approval anywhere — see [05](05-database-scheduled-jobs-webhooks.md).
- **No error-monitoring/APM tool** (Sentry, Datadog, CloudWatch, New Relic) exists anywhere in `Backend/services` — only local `pino` structured logs. If a service crashes or an OTP/payment webhook silently starts failing, nobody gets paged; you'd have to go looking at logs.
