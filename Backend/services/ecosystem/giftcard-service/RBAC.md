# giftcard-service — Access Model

Auth is RS256-only via `@baalvion/auth-node`'s canonical verifier (`middleware/authMiddleware.js`)
— same pattern as `community-service` and `jobs-service`. No local JWT issuance, no legacy
id/orgId/sessionId coercion.

## Routes

| Route | Auth | Notes |
|---|---|---|
| `GET /v1/giftcards/catalog` | none | Public — browsable gift card catalog |
| `GET /v1/giftcards/suppliers` | none | Public — which suppliers are configured (no secrets) |
| `POST /v1/giftcards/brands/:slug/checkout` | RS256 user | Creates a crypto payment-service charge |
| `GET /v1/giftcards/my-orders` | RS256 user | Caller's own orders + decrypted redeem codes for fulfilled ones |
| `POST /v1/giftcards/billing/fulfill` | `x-internal-secret` | payment-service's `BillingFulfillmentClient` only — never a browser |
| `POST /v1/giftcards/admin/catalog/sync` | RS256 user + `platform_admin`/`super_admin` role | Pulls the real supplier catalog into `gift_card_brands` |

## Supplier credentials

Real supplier credentials (`RELOADLY_CLIENT_ID`/`RELOADLY_CLIENT_SECRET`, and equivalents for
any future supplier) are read from environment only — never hardcoded, never logged. Redeem
codes are encrypted at rest (`service/codeVault.js`, AES-256-GCM) and only decrypted in memory
when the owning user requests their own order via `/my-orders`.
