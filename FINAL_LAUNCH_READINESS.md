# Commerce + Admin Platform — Final Launch Readiness Report

**Branch:** `feat/platform-foundation` (uncommitted) · **Date:** 2026-06-01
**Verification:** admin-platform `tsc --noEmit` → **0 errors** · backend **38/38 tests pass** ·
all edited services syntax-clean. Repo-wide launch audit run (30 agents, adversarially verified).

This report supersedes `COMMERCE_LAUNCH_READINESS.md` (the prior phase). Sections:
1. Completed · 2. Launch-audit reconciliation · 3. Launch blockers · 4. Remaining · 5. Risks ·
6. Recommended deployment sequence.

---

## 1. Completed this phase

### Admin UI (all four surfaces built + wired to real backends; whole app typechecks clean)
- **Product Media tab** on the product editor (`commerce/products/[id]`): upload w/ progress, thumbnail
  grid, featured selection, reorder, replace, delete — on the tested media API. New: `lib/api/product-media.ts`,
  `lib/queries/product-media.queries.ts`, `components/commerce/ProductMediaTab.tsx`.
- **Analytics dashboard** (`/commerce/analytics`): revenue KPIs, revenue-over-time, top products, revenue
  by country, **financial reconciliation** card, **inventory low-stock** panel — store-scoped, date ranges,
  real hooks (no mock). New: `lib/api/commerce-analytics.ts` (+queries) + page + `AnalyticsCharts.tsx`.
- **Audit Center** (`/audit-center`): All/RBAC/Payment/Security tabs over audit-service, server+client
  filters, **CSV export** (token-safe blob download), **hash-chain verify** button. New: `lib/api/audit-center.ts`
  (+queries) + page + `AuditEventsTable.tsx`.
- **Operations dashboard** (`/operations`): service health, Postgres/Redis dependency + CPU/mem/disk,
  BullMQ queue backlog, **reconciliation status + ledger sync + Run-backfill**. New: `lib/api/ops.ts` (+queries)
  + page + `ServiceHealthRow.tsx`.
- **Shared foundation:** registered `audit` (:3032) + `fulfillment` (:3016) service clients; nav entries for
  Audit Center + Operations; new `ProductMediaItem` type. **Fixed 5 pre-existing tsc errors** (missing
  fulfillment client) → admin-platform now fully green.

### Operations
- **Scheduled reconciliation sweep** (`order-service/queues/reconciliationQueue.js`): BullMQ repeatable,
  per active store, **alerts on drift** + **alerts when ledger unreachable**, optional **auto-backfill** —
  wired into startup. 4 tests.
- **Alerting** (`order-service/service/alerts.js`): drift / ledger-unavailable → notification-service
  (`/v1/notifications/dispatch`, internal key), fail-open, always logged (`ops.alert`).
- **Env verification** (`Backend/scripts/check-env.cjs`): per-service required/recommended check + the
  cross-service `LEDGER_INTERNAL_KEY` invariant. Updated `.env.example` for order/commerce/ledger (fixed
  order-service's stale HS256 var → RS256; documented `MEDIA_DRIVER`, `LEDGER_*`, `PAYMENT_PROVIDER`).
- **Operator runbooks** (`docs/runbooks/commerce-launch-operations.md`): env, reconciliation, ledger outage,
  media, payment go-live, RBAC onboarding, monitoring, inventory.

### Backend hardening (closing audit-confirmed blockers)
- **K8s health probes** added across the commerce vertical (`/healthz` liveness + `/readyz` readiness w/ DB
  check) — commerce, order, inventory, audit, ledger, payment. (The Helm chart probes `/readyz`+`/healthz`;
  services previously exposed only `/health` → pods would never become Ready.)
- **ledger-service ordering bug fixed**: `tenantContext` was global and 400'd unauthenticated health probes;
  now applied only on `/v1` mounts (after auth) so probes return 200/503.
- **Inventory low-stock endpoint** (`GET /inventory/stores/:storeId/alerts/low-stock` + summary counts).
- **Discount engine** (`order-service/service/discountService.js`) — server-authoritative resolution of
  `discountCode` against `commerce.commerce_discounts`: percentage / fixed_amount / free_shipping, with
  min-purchase, max-discount cap, active-window, and an **atomic usage-limit claim inside the order txn**
  (rolls back with the order). Replaces the `discount = 0` stub; wired into `createOrder`. 8 tests.
- **`/metrics`** (dependency-free Prometheus) added to commerce/order/inventory (the scrape config's targets).
- **Admin frontend base URLs** made env-overridable (`NEXT_PUBLIC_SERVICE_URLS` map / `NEXT_PUBLIC_SERVICES_HOST`)
  so production can route through the gateway without code changes — localhost preserved as the dev default.

### Prior phase (context, also uncommitted)
Product media backend, order→ledger double-entry + refund + reconciliation report/backfill, **ledger auth
bypass fix** (dependency-free RS256 + internal key, fail-closed), realtime health targets.

---

## 2. Launch-audit reconciliation

A 30-agent repo-wide audit produced 100 findings across 6 dimensions; the verify phase adversarially
confirmed **5 launch blockers** from the first batch of candidates. Status after this session:

| Confirmed blocker | Status |
| --- | --- |
| commerce-service missing `/readyz`,`/healthz` | ✅ **FIXED** this turn |
| order-service missing `/readyz`,`/healthz` | ✅ **FIXED** this turn |
| audit-service missing `/readyz` + no DB check | ✅ **FIXED** this turn |
| ledger-service `tenantContext` before health (probes 400) | ✅ **FIXED** this turn |
| Payment provider mock (deferred runtime failure) | ⚠️ **Config-gated** — documented `PAYMENT_PROVIDER` in `.env.example`; needs real keys before launch |

**Audit findings already resolved by this session's work** (the audit ran against the pre-build state):
ledger/audit/fulfillment service-client gaps, analytics-dashboard mock data, product-media frontend
integration, reconciliation-drift + ledger-fail alerting, missing reconciliation/ledger/payment runbooks,
undocumented `MEDIA_DRIVER`/`LEDGER_*`/order `.env.example`, env-verification tooling.

---

## 3. Launch blockers

### ✅ Resolved
- Ledger authentication bypass (impersonation on a financial service).
- K8s readiness/liveness probe mismatch (commerce/order/inventory/audit/ledger/payment).
- ledger health-probe 400 (tenant-guard ordering).
- Admin frontend service-client + dashboard gaps (audit/fulfillment clients, analytics real-wiring, media tab, audit center).
- **Discount/promo engine** — implemented (percentage / fixed_amount / free_shipping; min-purchase, max-cap, date window, atomic usage-limit claim; server-authoritative; 8 tests). `discount = 0` removed.
- **Admin frontend localhost coupling** — service base URLs are now env-overridable (`NEXT_PUBLIC_SERVICE_URLS` map and/or `NEXT_PUBLIC_SERVICES_HOST`) with the localhost dev default preserved.
- **Missing `/metrics`** — added dependency-free Prometheus endpoints to commerce/order/inventory.

### ⚠️ Remaining (must clear or consciously accept before go-live)
| Blocker | Severity | Effort | Notes |
| --- | --- | --- | --- |
| **Payment provider = mock** | CRITICAL | small (config) | Set `PAYMENT_PROVIDER` + real keys; smoke-test intent→confirm→capture→refund. Boot succeeds but first real payment fails until configured. |
| **Production service URLs not yet set** | MED | config | The frontend env override now exists; ops must populate `NEXT_PUBLIC_SERVICE_URLS` (gateway routes) for the external deploy. |
| **Hardcoded dev secrets / default DB passwords** in some infra service configs (search/report/developer/ledger) + payment-service scripts | HIGH | small | Replace with required env (boot guards) before exposing those services. ledger config defaults `DB_PASSWORD='postgres'`. |
| **Rate limiting** on payment/auth/login endpoints incomplete | HIGH | small | payment-service has webhook+gateway limiters; verify legacy `/v1` + auth-gateway login have limits. |
| **Discount coverage** | LOW | medium | `buy_x_get_y` + item-restricted (`appliesTo != all`) discounts are rejected with a clear message, not yet computed — fast-follow if needed. |

---

## 4. Remaining work (non-blocking, by theme)

**Payments & finance:** real provider keys; payment-service adapters ship with mock-mode
(safe — only when `mode!=='live'`); ensure prod tenants set `mode=live`. Discount engine now live for the
common types; `buy_x_get_y` / item-targeted promos are a fast-follow.

**Observability:** commerce/order/inventory now expose `/metrics` (minimal, dependency-free); upgrading to
full `prom-client` request histograms is a fast-follow. Structured logging in error handlers remains. The
ledger fail-open path is covered by the **scheduled drift/ledger alerts** (real-time per-post alerting
intentionally omitted to avoid alert storms).

**Frontend (out of this phase's 4-surface scope):** Payment Center dashboard; `security/page.tsx` still has
mock blocked-IPs + static compliance checks; legacy `audit-logs` page (dual-source) can be retired in favour
of the new Audit Center.

**Tech debt / duplication** (not launch-blocking): `response.js`/`errors.js`/`errorMiddleware.js`/
`pagination.js`/`authMiddleware.js` are copied across ~16 services while shared `@baalvion/{response,errors,
middleware}` packages exist unused; `s3Client.js`+`multipart.js` duplicated (cms ↔ commerce — deliberate, to
avoid a cross-service dep); dead `isStoreStaff` no longer referenced; legacy `commerce-service/service/rbac*.js`
shims superseded by `@baalvion/commerce-rbac`. Consolidation is a post-launch refactor.

**Docs:** several services lack `README.md`/`docs/` (order/inventory/ledger/notification/realtime). The
commerce operations runbook, `PRODUCT_MEDIA.md`, and env-check now exist; per-service READMEs remain.

---

## 5. Risks

| Sev | Risk | Mitigation |
| --- | --- | --- |
| HIGH | Ledger posting is fail-open — an outage silently drops entries until backfilled. | Scheduled sweep now **detects + alerts + (optionally) auto-backfills**. Set `RECONCILE_AUTO_BACKFILL=true` + an ops recipient. |
| HIGH | Reconciliation/ledger inactive unless `LEDGER_INTERNAL_KEY` is set (and equal in both services). | `check-env.cjs` flags the mismatch; runbook §1–2. |
| MED | Payments simulated until provider keys. | `PAYMENT_PROVIDER` documented; prod guard throws on mock. |
| MED | Discounts not applied to totals. | Documented; gate launch on whether promos are required. |
| MED | Admin frontend localhost coupling. | Route through gateway / env base URLs before external deploy. |

---

## 6. Recommended production deployment sequence

1. **Secrets & env:** generate RS256 keypair; set `JWT_PUBLIC_KEY` everywhere; set a strong shared
   `LEDGER_INTERNAL_KEY` in **order + ledger**; `CART_SESSION_SECRET`; `INTERNAL_SERVICE_SECRET`;
   real DB passwords (no defaults). Run `node Backend/scripts/check-env.cjs` until **RESULT: OK**.
2. **Payments:** set `PAYMENT_PROVIDER` + provider keys (order-service) and provider secrets + `mode=live`
   (payment-service). Never set `ALLOW_MOCK_PAYMENTS` in prod.
3. **Data:** run migrations (commerce/order/inventory/ledger/audit); `provisionCommerceRbac.cjs` once
   (super-admin) to seed RBAC roles + sync stores→tenants.
4. **Storage:** `MEDIA_DRIVER=s3`/`minio` + bucket + (optional) `sharp` for real thumbnails.
5. **Deploy services** behind the gateway; confirm `/readyz` (200) + `/healthz` on each before routing traffic.
6. **Enable reconciliation:** `RECONCILE_ENABLED=true`, set the cron + ops alert recipient; verify a capture
   produces a ledger entry and the report is `balanced`.
7. **Admin frontend:** point `serviceClients` base URLs at the gateway (not localhost); deploy admin-platform;
   smoke-test the 4 new surfaces.
8. **Observability:** scrape `/metrics`; wire the drift/ledger alerts to the on-call channel; dry-run a
   ledger-outage → backfill recovery (runbook §3).
9. **Go/No-go:** discounts decision (ship-without vs block); confirm rate limits on payment/auth; rotate any
   exposed dev secrets.

---

### Appendix — verification
- **admin-platform:** `npx tsc --noEmit` → exit 0 (entire app, incl. new dashboards + media tab + env-driven clients).
- **backend tests (46):** commerce media 7 · ledger auth 9 · order security 6 · reconciliation 6 ·
  reconcile-sweep 4 · ownership 6 · discount 8 — all pass.
- **edited entrypoints:** commerce/order/inventory/ledger/payment/audit `index.js` `node --check` clean.
