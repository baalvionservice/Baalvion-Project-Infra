# Payment Sandbox & Go-Live (Priority 2)

How to take the gateway payment vertical from **mock** to a **real provider sandbox**
(Stripe / Razorpay test mode) and then to production. No code changes are required — the
adapters already contain the live code paths; the provider + decrypted keys come **only**
from the CMS vault (`sdk.config`), keyed by website slug. payment-service stores no keys.

---

## 1. The three modes

| Mode | `config.mode` | Keys | Network | Use |
|---|---|---|---|---|
| **mock** (default) | `mock` | dev placeholders | none | local dev / CI — real adapter code + real signature crypto, no charge |
| **sandbox** | `live` | provider **test** keys (`sk_test_…` / `rzp_test_…`) | real provider | pre-launch verification with a real provider |
| **production** | `live` | provider **live** keys | real provider | GA |

"Stripe/Razorpay test mode" is simply the live code path driven by test keys — so **sandbox
and production share the exact same code**. The only difference is which keys sit in the vault.

---

## 2. Already verified WITHOUT live keys

`node warroom/payment_e2e.cjs` (mock mode) proves the full state machine with the **real**
adapter + **real** signature crypto:

- internal-auth required (401 without `x-internal-secret`)
- create intent → `201` (provider resolved from CMS vault)
- **signed** capture webhook → `200 processed` · **tampered** signature → `401`
- captured → ledger entry written
- refund → `refunded` + reverse (debit) ledger entry
- **idempotent** second refund → no double-refund
- cross-tenant refund (wrong site) → `404`

Guarantees that carry into sandbox/production unchanged:
- **Create idempotency:** `UNIQUE (website_slug, idempotency_key)` on `gateway_payments`.
- **Webhook retry-safety:** `UNIQUE (provider, provider_event_id)` on the ledger → a provider
  re-delivering the same event is a hard no-op (Razorpay also has a replay window).
- **Refund safety:** claim-before-provider-call; a crash mid-refund leaves a `refund_pending`
  row that the reconciliation sweep resolves — never a double refund.

---

## 3. Flip to a real provider sandbox (one step)

Keys come from the environment (never committed). The flip script refuses non-test keys.

### Stripe
```bash
STRIPE_TEST_SECRET_KEY=sk_test_xxx \
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxx \
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxx \
node Backend/services/knowledge/cms-service/scripts/configureSandboxPayments.cjs \
  --provider stripe --site baalvionstack-shop
```

### Razorpay
```bash
RAZORPAY_TEST_KEY_ID=rzp_test_xxx \
RAZORPAY_TEST_KEY_SECRET=xxx \
RAZORPAY_TEST_WEBHOOK_SECRET=xxx \
node Backend/services/knowledge/cms-service/scripts/configureSandboxPayments.cjs \
  --provider razorpay --site baalvion-mining
```

This writes AES-encrypted test keys into `cms.cms_website_integrations` and sets
`config.mode='live'`. Nothing else changes.

---

## 4. Verify the real sandbox transaction

```bash
# same webhook secret the vault now holds, so the local-signed event is valid
STRIPE_TEST_WEBHOOK_SECRET=whsec_xxx \
node warroom/payment_sandbox_e2e.cjs --provider stripe --site baalvionstack-shop
```

- **[1] create intent** → a real `pi_…` (Stripe) / `order_…` (Razorpay) — this is the real
  provider sandbox call.
- **[2] capture** → a provider-signed `payment_intent.succeeded` / `payment.captured` webhook.
- **[4] refund** → a real provider refund API call.
- **[5]** idempotent re-refund.

### Provider-delivered webhooks (closest to production)
Instead of the local-signed step, have the provider deliver real events:
```bash
stripe listen --forward-to http://localhost:3019/v1/gateway/webhooks/stripe?site=baalvionstack-shop
# then confirm the PaymentIntent in the Stripe dashboard (test card 4242 4242 4242 4242)
```
Razorpay: add the webhook URL in the Razorpay test dashboard and pay with a test card.

---

## 5. Production go-live checklist

1. Replace the test keys above with **live** keys (same script paths, `sk_live_…` — note the
   script's test-prefix guard is sandbox-only; use `configurePaymentSites.cjs` patterned with
   live keys, or set them via the admin CMS integrations UI).
2. Set a strong **`INTERNAL_SERVICE_SECRET`** in payment-service's environment. In production
   `appConfig` **refuses to start** with the dev default (`baalvion-internal-dev-secret`).
3. Register the production webhook endpoint with each provider and store its signing secret in
   the vault (`webhookSecret`).
4. Confirm `NODE_ENV=production`, real DB creds, and `CMS_SECRETS_KEY` (vault master key).
5. Smoke-test one real low-value charge + refund, then watch the ledger reconciliation report.

---

## 6. Rollback to mock

```bash
node Backend/services/knowledge/cms-service/scripts/configurePaymentSites.cjs   # re-sets mode:'mock'
```
