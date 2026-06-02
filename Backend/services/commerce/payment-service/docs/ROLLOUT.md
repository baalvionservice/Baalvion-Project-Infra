# Payment Rollout Runbook

How to enable real payments for a website using the SDK-native `payment-service`.
No code change is required per site — only a CMS vault entry. The first two rollout
sites (Proxy-BaalvionStack, Baalvion Elite Circle) are validated end-to-end (mock
mode) by `scripts/validate_rollout_2sites.cjs`.

## Prerequisites (per site) — operator-supplied

- A **real merchant account** with the provider (Razorpay / Stripe / PayU).
- The provider **API keys + webhook secret** for that account. These are SECRETS:
  enter them **only** through the admin CMS console (Integrations & Keys), which
  AES-encrypts them in the vault. **Never** commit them, paste them into code, or
  put them in `.env` files. (Push protection + the no-secrets rule apply.)
- The provider dashboard webhook configured to:
  `https://<gateway-host>/v1/gateway/webhooks/<provider>?site=<websiteSlug>`

## Steps per site

1. **Register the tenant** (if the site isn't already a CMS website) — it needs a
   `cms.cms_websites` row to key the vault by slug.
2. **Add the payment integration** in the CMS console: category `payment`,
   provider, keys + `webhookSecret`, `enabled=true`. Set `config.mode`:
   - `mock` — order creation simulated (no live charge); signature verification is
     still real. Use for staging / dry-run.
   - `live` — real provider API. Requires real keys.
3. **Dry-run in sandbox** (`mode: mock` or provider test keys): run a payment →
   signed webhook → confirm `captured`, ledger exactly once, traceId propagated.
4. **Go live**: flip `config.mode = live` with real keys. Run one low-value real
   payment, confirm the provider webhook is delivered + verified + ledgered once.
5. **Monitor**: watch `payment.*` events on `baalvion:events` and the ledger.

## Staged rollout order (recommendation)

Roll out one site at a time, lowest-risk first; verify each before the next.
Commerce/shop sites that actually take payments only — do **not** enable payments
on content-only sites. Business sign-off per site (it moves real money).

## Rollback

Set the integration `enabled=false` (or `mode=mock`) in the CMS console — the
resolver stops returning live keys immediately (SDK config cache TTL ≤ 60s, or
emit `cms.integration.updated` to bust it). No deploy needed.

## Guarantees already validated (mock mode, both pilot sites)

idempotent ledger (UNIQUE provider+event_id), duplicate-webhook ignored, tampered
signature → 401, cross-tenant read → 404, forward-only status, traceId on the
ledger row. See `scripts/validate_rollout_2sites.cjs` and `docs/GATEWAY_PAYMENTS.md`.
