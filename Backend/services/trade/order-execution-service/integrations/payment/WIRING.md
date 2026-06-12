# Payment integration — supervised cutover (WIRING)

These real adapters are NOT wired into the live order/payment hot path. Today the
hot path is simulated:

- `services/paymentClient.js` → `POST /api/v1/payments/initiate` (internal payment-service)
- `workers/paymentSimulator.js` → emits a terminal `payments.transaction.completed`

Both move ledger numbers, not real money. Cutting over to real money movement is a
**regulated, supervised** step. Do it deliberately, in a controlled environment, with
the operator who holds the Razorpay/RazorpayX + bank credentials.

## What is fully real vs. a seam

| Provider | File | Status |
|---|---|---|
| RazorpayX Payouts (INR bank/UPI/IMPS/NEFT/RTGS disburse) | `providers/razorpayx.js` | **Fully real + runnable** with keys. Originates real test/live payouts. |
| Razorpay Orders + signature verify (card/UPI collect) | `providers/razorpay.js` | **Fully real + runnable** with keys. Creates orders, verifies payment signatures. |
| SWIFT / ISO 20022 (cross-border) | `providers/swiftIso20022.js` | **Message is real** (pain.001 build + pain.002 parse). **Bank transport is a seam** — the bank must provide the host-to-host spec + mTLS/PGP certs. Default transport throws `IntegrationRequiredError`. |

## Required env per provider

RazorpayX (payout / disburse, INR):
- `RAZORPAYX_KEY_ID`, `RAZORPAYX_KEY_SECRET`, `RAZORPAYX_ACCOUNT_NUMBER`
- `RAZORPAYX_WEBHOOK_SECRET` (optional, for inbound payout webhooks)

Razorpay (collect, customer-present):
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET` (optional)

SWIFT / ISO 20022 (cross-border):
- `SWIFT_BANK_TRANSPORT` (impl id selecting a registered BankTransport), `SWIFT_DEBTOR_IBAN`, `SWIFT_DEBTOR_BIC`
- `SWIFT_DEBTOR_NAME` (optional)
- `SWIFT_ENDPOINT`, `SWIFT_CLIENT_CERT`, `SWIFT_CLIENT_KEY`, `SWIFT_PGP_KEY` (transport-specific, supplied by the bank)

Routing:
- `PAYMENT_PROVIDER_ROUTING` (optional JSON, e.g. `{"IMPS":"razorpayx","CARD":"razorpay","SWIFT":"swift"}`)

## Routing rules (router.js)

- INR + UPI/IMPS/NEFT/RTGS (or INR with no scheme) → **razorpayx**
- CARD / COLLECT / NETBANKING → **razorpay**
- SWIFT / SEPA, or any **non-INR** currency → **swift**
- `PAYMENT_PROVIDER_ROUTING` overrides per-scheme, but a non-INR amount never routes to the INR-only RazorpayX payout rail.

## Cutover steps (supervised)

1. **Provision credentials** in the secret manager (never in source). Start in Razorpay/RazorpayX **TEST mode**.
2. **Verify hermetically**: `npx jest integrations/payment` (all mocked). Then the gated live test: `RAZORPAYX_KEY_ID=… npx jest integrations/payment/razorpayx.live.test.js`.
3. **Turn off the simulator**: stop `workers/paymentSimulator.js` so it no longer emits fake `payments.transaction.completed`.
4. **Point `services/paymentClient.js`** at `createRealPaymentProvider()` instead of the internal `POST /api/v1/payments/initiate`. Keep the SAME `idempotencyKey` semantics (one key = one payment, replays return the original).
5. **Wire the inbound webhook** (later step): an Express route with **raw-body capture** (`express.raw`) → `verifyRazorpayWebhook({rawBody, signatureHeader: req.header('X-Razorpay-Signature'), secret})` → `parsePayoutEvent(body)` → idempotent upsert keyed by `reference_id` → emit the bus event the saga consumes. This is the authoritative settlement signal (FAIL-CLOSED: `COMPLETED` only on an explicit terminal success).
6. **For SWIFT**: implement a real `BankTransport` (`submit`/`fetchStatus`) against the bank's host-to-host channel, register it under `SWIFT_BANK_TRANSPORT`, inject via `createRealPaymentProvider({ swiftTransport })`. Until then SWIFT initiate throws `IntegrationRequiredError`.
7. **Go live** only after the provider's production go-live certification and the corridor money-transmission/EMI/PI licensing is in place.

## Posture (do not weaken)

- **FAIL-CLOSED**: a payment is `COMPLETED` only on an explicit terminal success from the provider/webhook.
- **Timeout = UNKNOWN**, surfaced as `IntegrationTimeoutError`. Reconcile via `getStatus(id)` or the webhook using the **same** `idempotencyKey`. Never re-initiate with a fresh key. Money-moving POSTs are never auto-retried.
