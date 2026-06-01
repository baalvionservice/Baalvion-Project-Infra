# Gateway Checkout Payments (Phase 3)

The SDK-native gateway-checkout vertical inside `payment-service` — website checkout
payments via **Razorpay / Stripe / PayU**, with provider + keys resolved entirely
from the CMS vault. It lives alongside the legacy interbank `Transaction` engine
(unchanged) and is the platform's first real **consumer** of `sdk.config`.

## Principles (enforced)

- **SDK is the only integration layer.** Provider + keys via `sdk.config`
  (→ CMS internal resolver), events via `sdk.events`, logs via `sdk.logger`,
  tracing via `sdk.trace`, service-to-service auth via `sdk.internalAuth`.
- **CMS is the only secret vault.** payment-service stores **no** provider keys and
  reads **none** from env. AES decryption happens only inside CMS; keys are
  delivered at runtime through the resolver. Flip a tenant to live by setting real
  keys + `config.mode = 'live'` in the CMS console — nothing in this service changes.
- **Tenant == CMS website slug** everywhere.

## Flow

```
POST /v1/gateway/payments            (sdk.internalAuth)         create intent
   → resolveProvider(slug)  [sdk.config.getPaymentProvider]     provider+keys from CMS vault
   → adapter.createOrder()  (mock | live)                        provider order / intent
   → GatewayPayment (UNIQUE website_slug+idempotency_key)        idempotent claim
   → emit payment.created

POST /v1/gateway/webhooks/:provider?site=<slug>   (public, signature-verified, rate-limited)
   → resolveProviderByName(slug, provider)  [vault webhook secret]
   → adapter.verifyWebhook()  (REAL HMAC/SHA-512, timing-safe)   reject → 401
   → adapter.parseWebhook()                                       canonical fields
   → normalizeWebhook() → { eventType, tenantId, transactionId, provider, amount, currency, traceId, payload }
   → TXN: PaymentLedgerEntry (UNIQUE provider+provider_event_id)  hard dedup
        + GatewayPayment.status  (forward-only; captured never downgraded)
   → emit payment.<status> + payment.ledger.recorded

GET  /v1/gateway/payments/:id?site=<slug>   (sdk.internalAuth, tenant-scoped → 404 cross-tenant)
```

## Idempotency / no-duplicate-payments

- **Create**: `UNIQUE(website_slug, idempotency_key)` + `findOrCreate` claim — the
  external provider order is created only by the request that wins the insert.
- **Webhook**: `UNIQUE(provider, provider_event_id)` is the hard guarantee — a
  replayed webhook trips it inside the transaction → caught → idempotent no-op
  (200, no second ledger row, no second event). Dedup keys are derived from the
  **signed body** (e.g. razorpay `event:entity_id`), stable across retries yet
  distinct across lifecycle events.
- **Status**: forward-only FSM (`created→authorized→captured→refunded`); a late or
  reissued `failed` cannot overwrite a terminal `captured` (the event is still
  recorded in the ledger for audit).

## Webhook URL registration

Configure the provider dashboard webhook to:
`https://<host>/v1/gateway/webhooks/<provider>?site=<websiteSlug>`
The tenant slug MUST be in the URL (fixed at registration) — it is never taken
from a request header.

## Local 2-website E2E

```bash
# 1) configure providers in the CMS vault (test keys + webhook secret, mock mode)
node Backend/services/knowledge/cms-service/scripts/configurePaymentSites.cjs
# 2) boot CMS (vault/resolver) + payment-service (matching INTERNAL_SERVICE_SECRET)
PORT=3918 node Backend/services/knowledge/cms-service/index.js &
PORT=3915 CMS_BASE_URL=http://localhost:3918/api/v1 KAFKA_ENABLED=false QUEUE_WORKERS=false \
  RUN_MIGRATIONS=false DB_NAME=baalvion_db DB_USER=baalvion DB_PASSWORD=... \
  node Backend/services/commerce/payment-service/index.js &
# 3) run the hardened E2E (create → signed webhook → ledger → event, x2 sites)
node Backend/services/commerce/payment-service/scripts/e2e_two_sites.cjs
```

Verified: baalvion-mining (razorpay) + baalvionstack-shop (stripe) each complete the
full cycle — auth enforced, idempotent dedup, tenant isolation (IDOR→404), signature
rejection, traceId propagated to the ledger, status never downgraded.

## Notes / follow-ups

- The legacy interbank `Transaction` engine (Kafka/winston) is a separate subsystem;
  its `console.*`/migrations are pre-existing and out of this vertical's scope (the
  broken `migrate.js` is now non-fatal + opt-out via `RUN_MIGRATIONS=false`).
- The per-instance rate limiter should be Redis-backed (`@baalvion/cache`) for
  horizontally-scaled production.
- `EVENT_TRANSPORT=noop` logs events; set `nats` when the bus is provisioned — no
  code change. The ledger consumer in `ledger-service` can subscribe to
  `payment.ledger.recorded` for a system-of-record mirror.
