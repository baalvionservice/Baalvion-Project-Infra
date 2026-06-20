# MVP Smoke Test Checklist — Baalvion (v1.0.0-mvp)

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only. These smoke tests still validate **Stack A (storefront)** and remain
> useful for it; the canonical per-stack smoke checks (Stacks A / C / B) live in MASTER §10.
> Where this file disagrees with MASTER, **MASTER wins.**

> Run after **AWS_DEPLOYMENT_RUNBOOK.md** Step 13, against the live `*.baalvion.com`
> hostnames. Each test has an action, the expected result, and a curl probe where
> applicable. Stop and triage on the first ❌ — later tests depend on earlier ones.
>
> Gateway base: `https://api.baalvion.com`. Admin: `https://admin.baalvion.com`.
> Storefront: `https://shop.baalvion.com`. Public site: `https://baalvion.com`.

---

## Pre-test — service health

```bash
for p in 3001:health 3099:health 3055:health 3018:health 3012:readyz \
         3014:readyz 3013:readyz 3031:health 3032:readyz; do
  curl -fsS http://localhost:${p%%:*}/${p##*:} && echo "  OK ${p%%:*}"; done
curl -fsS http://localhost:3015/actuator/health     # payment-service → {"status":"UP"}
curl -I https://api.baalvion.com/health             # 200 over TLS via Caddy
```
- [ ] All 9 Node services + payment-service healthy; gateway reachable over HTTPS.

---

## 1. Registration

**Action:** register a new user via the gateway.
```bash
curl -sS -X POST https://api.baalvion.com/api/v1/identity/auth/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke+1@baalvion.com","password":"Smoke!Test2026","name":"Smoke Test"}' -i
```
- [ ] **HTTP 201** with a user id in the body.
- [ ] User row created in `auth` schema.
- [ ] No 5xx; CORS header echoes an allowed origin.

## 2. Email verification

**Action:** confirm the verification email is dispatched via SES.
- [ ] Verification email **received** at `smoke+1@baalvion.com` (SES out of sandbox, DKIM signed).
- [ ] Hitting the verification link / `POST .../auth/verify-email` marks the user verified.
- [ ] notification-service / auth-service logs show SES `250 OK` (no SMTP auth error).

> If SES is still in sandbox, only verified recipients receive mail — verify the test
> address in SES first or complete the production-access request.

## 3. Login

**Action:** authenticate the (verified) user.
```bash
curl -sS -X POST https://api.baalvion.com/api/v1/identity/auth/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke+1@baalvion.com","password":"Smoke!Test2026"}' -i
```
- [ ] **HTTP 200** with `accessToken` + `refreshToken` (or httpOnly refresh cookie set).
- [ ] Login also works through the admin/storefront UI (BFF sets first-party session cookie).

## 4. JWT issuance & verification

**Action:** confirm the access token is a valid RS256 JWT the gateway accepts.
```bash
# Decode header/payload (no secret needed) — alg must be RS256, iss/aud correct:
echo "<accessToken>" | cut -d. -f1 | base64 -d 2>/dev/null    # {"alg":"RS256",...}
# JWKS published:
curl -fsS https://api.baalvion.com/.well-known/jwks.json
# Authenticated call succeeds with the token:
curl -sS https://api.baalvion.com/api/v1/identity/auth/v1/auth/me \
  -H "Authorization: Bearer <accessToken>" -i
```
- [ ] `alg=RS256`, `iss=baalvion-auth`, `aud=baalvion-platform`.
- [ ] JWKS endpoint serves the public key.
- [ ] `/auth/me` (or equivalent) returns the user with a valid token; **401** without one.

## 5. RBAC enforcement

**Action:** verify role-gated access is enforced fail-closed.
- [ ] Superadmin (`SUPERADMIN_EMAIL`) can reach admin-only endpoints; **rotated** password works.
- [ ] The plain smoke user is **denied (403)** on an admin/RBAC-protected route.
```bash
# Protected commerce/admin write as a non-privileged user → 403:
curl -sS -X POST https://api.baalvion.com/api/commerce/api/v1/products \
  -H "Authorization: Bearer <smoke-user-token>" -H 'Content-Type: application/json' \
  -d '{}' -i        # expect 401/403, NOT 500
```
- [ ] commerce/order with `RBAC_FAIL_MODE=closed` reject unauthorized internal calls
      (rbac-service down ⇒ deny, never allow).

## 6. CMS publishing

**Action:** create + publish content in admin; confirm it appears on the public site.
- [ ] In `admin.baalvion.com`, create/publish a content item for website `about-baalvion`.
```bash
# Public delivery API serves the published item:
curl -fsS "https://api.baalvion.com/api/cms/api/v1/public/about-baalvion/content" | head
```
- [ ] Published content visible on `https://baalvion.com` (about-web reads the CMS public API).
- [ ] Unpublished/draft content is **not** exposed by the public endpoint.

## 7. Product creation

**Action:** create a product for the Amarisé store via admin/commerce.
```bash
curl -sS -X POST https://api.baalvion.com/api/commerce/api/v1/products \
  -H "Authorization: Bearer <admin-token>" -H 'Content-Type: application/json' \
  -d '{"storeId":"<AMARISE_STORE_ID>","name":"Smoke Product","price":1999,"currency":"INR","stock":10}' -i
```
- [ ] **HTTP 201**; product row in `commerce` schema with the store UUID.
- [ ] Product media (if uploaded) lands in `baalvion-media-prod` and renders from `S3_PUBLIC_URL`.

## 8. Product listing (storefront)

**Action:** confirm the product surfaces in the storefront API + UI.
```bash
curl -fsS "https://api.baalvion.com/api/commerce/api/v1/storefront/<AMARISE_STORE_ID>/products" | head
```
- [ ] Product appears in the storefront listing JSON.
- [ ] Product visible on `https://shop.baalvion.com` (amarise-web resolves `NEXT_PUBLIC_STORE_ID`).
- [ ] Product image loads (host allowed by `NEXT_PUBLIC_MEDIA_HOST` / next image CSP).

## 9. Inventory reservation

**Action:** confirm stock is reserved on add-to-cart / checkout start.
- [ ] Adding the product to a cart reserves stock in `inventory` schema (available count drops).
- [ ] Reservation honors `INVENTORY_LOCK_TTL_MINUTES=15` (expires + releases if abandoned).
- [ ] order↔inventory internal call authenticated by `INVENTORY_INTERNAL_KEY` (matching value).

## 10. Order creation

**Action:** check out on `shop.baalvion.com`.
- [ ] Order row created in `orders` schema with **server-priced** line items (price not trusted from client).
- [ ] Checkout returns Razorpay `clientParams` (keyId / amount / currency) from order-service.
- [ ] order-service resolved Razorpay keys: per-site CMS vault (`PAYMENT_SITE_SLUG`) or env fallback.

## 11. Razorpay payment

**Action:** complete a real (live) payment, verify backend-authoritative settlement.
- [ ] Browser Razorpay SDK completes payment with the returned `clientParams`.
- [ ] Backend `confirmPayment` settles the order (server-side verification, not client claim).
- [ ] **Webhook** `payment.captured` / `order.paid` hits
      `https://api.baalvion.com/api/v1/orders/webhooks/razorpay`:
  - [ ] `X-Razorpay-Signature` HMAC-SHA256 verified (tampered signature ⇒ 400).
  - [ ] `RAZORPAY_WEBHOOK_STRICT_AMOUNT=true` rejects amount mismatch.
- [ ] Order marked **paid** in `orders` schema; webhook is idempotent (replayed event ⇒ no double-settle).
```bash
# Confirm the webhook route bypasses JWT (reachable without a bearer token, returns 4xx on bad sig):
curl -sS -X POST https://api.baalvion.com/api/v1/orders/webhooks/razorpay \
  -H 'X-Razorpay-Signature: bad' -d '{}' -i      # expect 400, NOT 401/500
```

---

## Acceptance summary

```
[ ] 1.  Registration            201 + user row
[ ] 2.  Email verification       SES mail received + verified
[ ] 3.  Login                    200 + access/refresh tokens
[ ] 4.  JWT issuance             RS256, iss/aud correct, JWKS live
[ ] 5.  RBAC                     fail-closed, 403 for non-privileged
[ ] 6.  CMS publishing           public API + baalvion.com show content
[ ] 7.  Product creation         201 + commerce row + media in S3
[ ] 8.  Product listing          storefront API + shop.baalvion.com
[ ] 9.  Inventory reservation    stock held with 15-min TTL
[ ] 10. Order creation           orders row, server-priced, clientParams
[ ] 11. Razorpay payment         captured + webhook verified + paid
```

**All 11 green ⇒ MVP is functionally live.** Record evidence (HTTP codes, order id,
Razorpay payment id, webhook delivery id) in the deployment-day log.
