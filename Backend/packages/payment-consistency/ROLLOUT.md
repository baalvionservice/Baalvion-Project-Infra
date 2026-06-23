# PCL Rollout & Rollback Runbook

Operational companion to `README.md` §4. This PR ships **Phase 1 (shadow mode), default OFF**.
Enforcement is explicitly **not** in scope here. Every phase is independently deployable and
reversible; no phase introduces double-charge risk.

---

## Phase 0 — Land the schema (no behaviour change)

PCL tables live in the **`pcl` schema inside each service's own database** (so the drift probes can
join legacy ↔ PCL in one query). The migration is idempotent and purely additive (verified: no
DROP/ALTER/TRUNCATE/UPDATE, no reference to any existing schema, 9× `IF NOT EXISTS`).

Apply to **each** database that holds payments you intend to shadow (order-service DB, ctm-service DB):

```bash
psql "$ORDER_DATABASE_URL" -f Backend/packages/payment-consistency/migrations/001_pcl_core.sql
psql "$CTM_DATABASE_URL"   -f Backend/packages/payment-consistency/migrations/001_pcl_core.sql
```

Creates `pcl.payment_state`, `pcl.payment_inbox`, `pcl.payment_outbox`. They are read by nobody and
written by nobody until shadow mode is enabled → **zero risk**.

> Safe ordering note: you may apply the migration **before or after** deploying this code. If
> `PCL_SHADOW=true` is set before the migration is applied, `apply()` throws "relation does not
> exist" — which the shadow adapter **catches and logs**, never propagating into the legacy path.

---

## Phase 1 — Shadow mode (this PR; PCL is NOT authoritative)

The legacy capture/fail path is **unchanged and authoritative**. With the flag on, each shadowed
adapter *additionally* calls `pcl.apply(normalize(event))` post-commit, fire-and-forget, never
throwing. PCL state is populated in parallel; drift is logged. Nothing is published downstream.

**Enable (staging / canary first):**
```bash
# order-service and ctm-service process env
PCL_SHADOW=true
```

**Wiring points (already in this PR):**
- order-service: `service/orderService.js` → `capturePaymentFromWebhook` (success) and `failPayment`.
- ctm-service: `controller/paymentsController.js` → `handleWebhook` (succeeded) and `payuReturn`.

**Validate** (let real traffic flow, then run the §3 probes from `PCL_DRIFT_REPORT.md`):
```sql
-- conflicts are the only actionable drift
SELECT count(*) FROM pcl.payment_outbox WHERE type = 'PAYMENT_CONFLICT';
-- and grep the app logs:  {"evt":"pcl_shadow.warn","drift":true,...}
```

**Rollback (instant, no data migration to undo):**
```bash
PCL_SHADOW=false   # or unset
```
Legacy path was never modified. PCL tables can be left in place (empty/parallel) or dropped:
`DROP SCHEMA pcl CASCADE;`.

---

## Phase 2 — Enforcement (a SEPARATE, FUTURE PR — do NOT enable here)

Only after the Go/No-Go threshold in `PCL_DRIFT_REPORT.md` §6 is met:
- Flip `PCL_ENFORCE=true` per service (flag does not exist yet — added in the enforcement PR).
- Order/fulfilment decisions read `pcl.payment_state` (or consume `PAYMENT_CAPTURED`/`_SETTLED`).
- Legacy `status` columns become PCL-mirrored read models instead of independent writers.
- Point the relay at the production Kafka topics downstreams already consume.
- **Rollback:** `PCL_ENFORCE=false` falls back to legacy reads; shadow writes continue.

> 🚫 **Non-negotiable for this PR:** no enforcement flag, no relay to production topics, no change to
> gateway logic, no legacy code removed.

---

## Outbox relay (Phase 2 concern, noted here for completeness)

In shadow mode **no relay is started** — `pcl.payment_outbox` rows accumulate as `pending` and are
read by nobody (PCL "emits to nobody"). When enforcement begins, drain them with the existing,
already-tested `@baalvion/events` relay — zero new delivery infra:

```js
import { createPgOutboxStore, startOutboxRelay } from '@baalvion/events';
const relay = startOutboxRelay(
  createPgOutboxStore({ runner: pool, schema: 'pcl', table: 'payment_outbox' }),
  publisher, logger, { pollMs: 2000 },
);
```
Delivery is at-least-once + bounded retry + dead-letter; consumers dedupe by event id
(`idempotent()` / `SeenStore`) → end-to-end exactly-once.

---

## Quick reference

| Action | Command |
|--------|---------|
| Apply schema | `psql "$DB" -f migrations/001_pcl_core.sql` |
| Enable shadow | `PCL_SHADOW=true` |
| Disable shadow (rollback) | `PCL_SHADOW=false` |
| Drift count | `SELECT count(*) FROM pcl.payment_outbox WHERE type='PAYMENT_CONFLICT';` |
| Remove entirely | `DROP SCHEMA pcl CASCADE;` (after disabling the flag) |
