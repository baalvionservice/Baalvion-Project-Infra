# Baalvion War-Room Report — Live Revenue Path + Security

**Date:** 2026-06-02 · **Scope chosen:** *Live revenue path + security* · **Method:** ground-truth → RCA → fix → deploy → verify, with **real** tool output only (no fabricated evidence).

> Honesty note: the original prompt assumed a live production platform. In reality this is a **dev/integration monorepo with the app tier mostly down**. I restored and verified the checkout-critical slice and its security. The broader platform (15 frontends, monitoring coverage, backups, IR service, CORS/CSP, auth-service live login/logout) was **out of the chosen scope and remains unverified** — stated plainly below. No "95/100 public launch" is claimed.

---

## Environment ground truth
- **Infra (Docker):** postgres, redis, minio, grafana, prometheus, mailpit, keycloak, traefik — healthy. Docker Desktop engine **crashed mid-session**; I restarted it and the `restart: unless-stopped` services recovered.
- **App tier at start:** only `order-service` (:3013) and `law-service` (:3015) running; rbac/payment/auth/commerce and all frontends down.
- **Audit claims were partly stale:** e.g. "commerce fail-open authz" — the code already defaults `RBAC_FAIL_MODE=closed`.

---

## Fixed Issues (each verified live)

| # | Issue (root cause) | Fix | Evidence |
|---|---|---|---|
| 1 | **Revenue path dead in prod mode** — mock provider throws under `NODE_ENV=production` without opt-in, so `payments/intent` 500'd | Added `ALLOW_MOCK_PAYMENTS=true` to order-service (local stack) | BEFORE: intent → **500** "PAYMENT_PROVIDER not configured"; AFTER: order→intent→confirm→**`paid`**, idempotent re-confirm no double-capture |
| 2 | **rbac-service down (P1 #1)** | Booted :3055 with RS256 key; ran `provisionCommerceRbac` (US country + Amarisé org tenant + store-team roles); assigned ops_manager/store_viewer | `/health` 200; `users/:id/effective` returns roles live; assignments 201 |
| 3 | **Deployed order-service image was STALE** — container had **no IDOR defense, no RBAC PEP, no `@baalvion/commerce-rbac`, no refund route**; the IDOR hole was *live* (cross-customer GET returned 200) | Rebuilt from current source + **redeployed** to :3013 | BEFORE grep: `NO refund`,`0 ownership`; AFTER: refund route present, `commerce-rbac` linked, **all suites pass on the live container** |
| 4 | **Build can't reproduce (CI-blocking)** — `pnpm-lock.yaml` out of date vs order-service `package.json` (missing `@baalvion/commerce-rbac`) → `ERR_PNPM_OUTDATED_LOCKFILE` | Regenerated lockfile (`pnpm install --lockfile-only`) | Lockfile now links `@baalvion/commerce-rbac`; build proceeds past install |
| 5 | **payment-service ↔ law-service host port 3015 collision** | Remapped payment-service host → 3019 (internal `payment-service:3015` unchanged) | docker-compose.yml |
| 6 | **P1 #4 cross-customer IDOR** | (current source already enforces `ownership.enforce`) verified | other shopper GET order → **403 FORBIDDEN**; create intent → **403** |
| 7 | **P1 #5 store-role enforcement / refund** | verified against live RBAC PDP | end_user list → **403**; store_viewer refund → **403**; ops_manager refund → **201 → `refunded`** |
| 8 | **P3 token revocation** — order-service did not check the JTI blacklist (revoked tokens still worked) | Wired `redis` into order-service `createAuthMiddleware` (fail-closed) | revoked `jti` in `auth:blacklist:*` → same token → **401 BLACKLISTED** |
| 9 | **P7 malformed JSON → 500** | order-service + rbac-service error handlers now map body-parser errors → 400/413 | malformed body → **400 BAD_REQUEST** on both (payment-service already correct) |

**Files changed (tracked):** `docker-compose.yml`, `order-service/middleware/{authMiddleware,errorMiddleware}.js`, `rbac-service/middleware/errorMiddleware.js`, `pnpm-lock.yaml` (+119/-3). **Test harnesses (new):** `warroom/{mint,revenue_e2e,enforcement_e2e,security_e2e}.cjs`.

---

## Security Status
- **Authorization fails CLOSED** by default (`RBAC_FAIL_MODE=closed`) — verified.
- **Cross-tenant/customer isolation (IDOR):** enforced in current source — a non-owner gets **403**.
- **Store-role enforcement:** ops_manager required for refunds/admin ops; store_viewer/end_user denied — verified.
- **Token revocation (JTI blacklist):** mechanism sound (fail-closed); now enforced at order-service — revoked token → 401.
- **Malformed input:** 400, not 500.
- **Gap:** the JTI blacklist redis-wiring should be replicated to the **other** resource services (commerce, payment, inventory) — currently only auth-edge + order-service check it.

## Revenue Status
- **Mock checkout flow: WORKING end-to-end, live** — Product → Order → Payment Intent → Confirmation → **Paid** → Refund, with server-authoritative pricing, idempotency, backend-authoritative capture, and double-entry-ledger mirroring hooks.
- **Real gateway flow (Razorpay/Stripe via CMS vault + signed webhooks):** code-complete in `payment-service` but **NOT live-verified** here (needs CMS provider config + webhook signature simulation). Port collision that blocked booting it is fixed.

---

## Remaining Issues (out of executed scope — NOT verified)
- **Deployment:** order-service rebuilt + redeployed to :3013 and **re-verified green on the live container** ✅. The `ALLOW_MOCK_PAYMENTS` flag and rbac-on-host wiring are **local-stack affordances**; production must configure a real payment provider and containerize rbac-service (add it to compose; it currently runs as a host process the container reaches via `host.docker.internal:3055`).
- **auth-service live login/logout** (P3 end-to-end): service was down; revocation *mechanism* verified, full login→logout→reject loop not driven.
- **Real payment gateway + webhook** (P2): not live-verified.
- **IR service 500s (P6), CORS/CSP frontends (P5), 15 frontends (P4), Prometheus coverage (P8), backups (P9):** not addressed in this scope.
- **`.dockerignore`:** build context is 2.23 GB (node_modules not excluded) — slow builds; should be tightened.
- **Lockfile also missing `Backend/packages/sdk`** (turbo warning) — verify before a full platform build.

---

## Production Readiness

| Surface | Score | Verdict |
|---|---|---|
| **Commerce revenue + authz vertical** (scoped) | ~90/100 | **READY FOR LIMITED BETA** — rebuilt image redeployed + verified live; needs a real payment provider + containerized rbac-service for prod |
| **Baalvion platform overall** | ~50/100 | **INTERNAL TESTING ONLY** — most surfaces (frontends, monitoring, backups, auth live, IR) are unverified |

**Single honest verdict for a public launch decision: `NOT READY` / `INTERNAL TESTING ONLY`.** The commerce checkout + its authorization are now demonstrably correct and secure in source; the rest of the platform has not been brought up or verified and must be before any public launch.
