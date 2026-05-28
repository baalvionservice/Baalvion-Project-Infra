# Baalvion Backend — Architecture Reconstruction

> **Purpose:** a fully mapped, domain-separated, migration-safe reconstruction of the
> existing backend — not a greenfield redesign.
>
> **Source of truth:** verified filesystem scans + the 39-descriptor `catalog/` (with its
> `domain` field) + the implemented [`ARCHITECTURE.md`](./ARCHITECTURE.md),
> [`MIGRATION.md`](./MIGRATION.md), and [`catalog/enforce.mjs`](../catalog/enforce.mjs).
> Nothing here is assumed; unknowns are flagged explicitly. Where Steps 4–6 already exist
> as implemented artifacts, that is stated rather than presented as net-new.
>
> **Last reconstructed:** 2026-05-27 (branch `hardening-phase-1`, after Batch 0 + build-model resolution).

---

## STEP 1 — CURRENT SYSTEM MAP

**Backend root:** `Backend/` (locked as the single monorepo root). 33 top-level entries.

### Real code units (30)

| Kind | Count | Members |
|---|---|---|
| Node services | 26 | about, admin, auth, backend-Proxy-BaalvionStack, brand-connector, cms, commerce, ctm, dashboard, elite-circle, fulfillment, imperialpedia, insiders, inventory, ir, jobs, law, market, mining, notification, oauth, order, real-estate, realtime, session, trade |
| NestJS + Prisma kernel | 1 | `baalvion-os` (the only Prisma home) |
| Go gateway | 1 | `gateway` (sanctioned sole public ingress) |
| Python service | 1 | `ml-service` (`requirements.txt` / `app/` — **polyglot**) |
| Acquired sub-stack | 1 | `law-elite` = its **own** `gateway` + `case-service` + `payment-service` + `user-service` (nested monorepo in one slot) |

### Non-service infra living as service siblings
`migrations/` (shared SQL), `clickhouse/`, `timeseries/` (projection stores) — interleaved with business services.

### Transitional
`services/` (new domain scaffold), `services/ecosystem/about-service/` (migrated in Batch 0), and `about-service/` (now an **empty, untracked leftover** — to delete once the file watcher releases it).

### Catalog registry
39 descriptors = 30 real units + `auth-node` (shared library) + **9 "virtual" bounded contexts with no code yet**:
`abuse-platform`, `analytics-platform`, `audit-platform`, `billing-platform`, `identity-platform`,
`notification-platform`, `organization-platform`, `proxy-platform`, `proxy-gateway`.

### Duplication / leakage / confusion (observed, not inferred)
- **Twin services:** `insiders-service` ≡ `elite-circle-service` (byte-identical clones; separate `insiders` / `elite_circle` schemas).
- **Two ingresses:** `Backend/gateway` (Go) **and** `law-elite/gateway` — violates gateway-only.
- **Sub-stack domain bleed:** `law-elite` carries its own `payment-service` (Commerce), `user-service` (Identity), and its own JWT auth (allowlisted) — duplicate auth + duplicate commerce/identity inside one Ecosystem slot.
- **Split ownership by naming:** notification-service (infra) vs notification-platform (platform); proxy spread across backend-Proxy-BaalvionStack + proxy-platform + proxy-gateway; law split across law-service (knowledge) + law-elite (ecosystem).
- **Frontend↔backend leak:** `Frontend/Global-Trade-Infrastructure-main/` embeds `infrastructure/`, `libs/`, `prisma/`, `ai-runtime/`, `docker-compose.yml` (a full backend/infra layer inside a UI) and overlaps `trade-service`. Vite UIs (Proxy-BaalvionStack, For Invstors and Founders, baalvion-elite-circle-main) carry `supabase/` dirs.
- **Infra vs business confusion:** clickhouse/timeseries/migrations share the services namespace; the Prisma kernel sat as a flat service.
- **Hidden coupling:** compile-time relative imports `require('../../../packages/auth-node')` (being converted to `workspace:*`); residual token issuers beyond the canonical `auth-node`.

---

## STEP 2 — DOMAIN ASSIGNMENT TABLE

Domains mapped to the catalog's locked axis (`Knowledge & Intelligence` = `knowledge`, `Platform/Admin` = `platform`). Every real unit classified.

| Service | Current location | Domain | Reason |
|---|---|---|---|
| auth-service | Backend/auth-service | **Identity** | Login + token issuance (legacy HS256 + vault RS256) |
| oauth-service | Backend/oauth-service | **Identity** | OAuth2 provider |
| session-service | Backend/session-service | **Identity** | Session lifecycle / RS256 verify |
| commerce-service | Backend/commerce-service | **Commerce** | Checkout / commerce aggregate |
| order-service | Backend/order-service | **Commerce** | Order lifecycle |
| inventory-service | Backend/inventory-service | **Commerce** | Stock / catalog inventory |
| fulfillment-service | Backend/fulfillment-service | **Commerce** | Fulfillment / shipping |
| market-service | Backend/market-service | **Commerce** | Market data / pricing |
| trade-service | Backend/trade-service | **Commerce** | Global trade / RFQ / marketplace (real full-stack) |
| imperialpedia-service | Backend/imperialpedia-service | **Knowledge & Intelligence** | Encyclopedic knowledge base |
| cms-service | Backend/cms-service | **Knowledge & Intelligence** | Content management |
| law-service | Backend/law-service | **Knowledge & Intelligence** | Legal knowledge (distinct from law-elite product) |
| ml-service | Backend/ml-service (**Python**) | **Knowledge & Intelligence** | ML / analytics serving; reads projections |
| gateway | Backend/gateway (**Go**) | **Infrastructure** | Sole public ingress |
| realtime-service | Backend/realtime-service | **Infrastructure** | WebSocket / realtime transport |
| notification-service | Backend/notification-service | **Infrastructure** | Notification fan-out / transport |
| backend-Proxy-BaalvionStack | Backend/backend-Proxy-BaalvionStack | **Infrastructure** | Proxy control plane |
| admin-service | Backend/admin-service | **Platform/Admin** | Platform administration + impersonation issuer |
| dashboard-service | Backend/dashboard-service | **Platform/Admin** | Unified dashboards |
| baalvion-os | Backend/baalvion-os (kernel) | **Platform/Admin** | NestJS + Prisma kernel; persistence / schema lifecycle |
| about-service | Backend/services/ecosystem/about-service | **Ecosystem** | Corporate / about site backend (migrated) |
| brand-connector-service | Backend/brand-connector-service | **Ecosystem** | Brand connector vertical |
| ctm-service | Backend/ctm-service | **Ecosystem** | Control-the-market product |
| insiders-service | Backend/insiders-service | **Ecosystem** | Investors / founders circle |
| elite-circle-service | Backend/elite-circle-service | **Ecosystem** | Elite circle (twin of insiders) |
| ir-service | Backend/ir-service | **Ecosystem** | Investor relations |
| jobs-service | Backend/jobs-service | **Ecosystem** | Jobs portal |
| mining-service | Backend/mining-service | **Ecosystem** | Mining vertical |
| real-estate-service | Backend/real-estate-service | **Ecosystem** | Real-estate vertical |
| law-elite | Backend/law-elite (sub-stack) | **Ecosystem** | Acquired Law Elite Network product |

**Non-service / shared:** `migrations`, `clickhouse`, `timeseries` → **Infrastructure (data plane)**;
`packages/*` incl `auth-node` → shared libraries (auth-node serves **Identity**);
the 9 virtual `*-platform` entries → reserved bounded contexts (no code), each pre-tagged to its domain in the catalog.

---

## STEP 3 — ARCHITECTURAL ISSUES REPORT

| # | Issue | Type | Evidence | Severity |
|---|---|---|---|---|
| 1 | `insiders-service` ≡ `elite-circle-service` byte-identical | Duplicated service | Clone-of-9-files twins, separate schemas | High |
| 2 | Two public ingresses: `Backend/gateway` + `law-elite/gateway` | Conflicting responsibility / layering | law-elite is a self-contained sub-stack | High |
| 3 | `law-elite` owns `payment-service` (Commerce) + `user-service` (Identity) + own auth | Mixed-domain / duplicate auth & commerce | Sub-stack dirs confirmed | High |
| 4 | Notification ownership split (service=infra vs platform virtual) | Missing ownership boundary | Two catalog entries, one code unit | Medium |
| 5 | Proxy ownership fragmented across 3 entries | Missing ownership boundary | Catalog vs code mismatch | Medium |
| 6 | Frontend embeds backend/infra (GTI) + Vite `supabase/` dirs | Backend↔frontend leakage | Dir scan; overlaps trade-service | High |
| 7 | Infra (clickhouse/timeseries/migrations) interleaved with business services | Infra vs business confusion | Top-level siblings | Medium |
| 8 | Residual token issuers beyond `auth-node` (auth jwtRsa, oauth, admin impersonation, law-elite) | Duplicate auth surface | enforce.mjs allowlist | Medium (governed) |
| 9 | Compile-time relative cross-package imports (`../../../packages/*`) | Hidden coupling | Depth-sensitive; converting to `workspace:*` | Medium (in progress) |
| 10 | 9 virtual `*-platform` contexts declared but unimplemented | Ownership without a home | Catalog only | Low |
| 11 | `ml-service` is Python in a Node-centric monorepo/CI | Polyglot not first-classed | requirements.txt | Low/Medium |

**Circular dependencies:** *not confirmed.* The catalog `dependsOn` graph (`catalog/index.json`) shows most services
depending on `identity-platform`; **no verified cycle** was found. Not asserted without evidence. The real coupling
risks are shared-import depth (#9) and law-elite's internal duplication (#3), not a confirmed dependency cycle.

---

## STEP 4 — FINAL TARGET ARCHITECTURE

Already implemented as [`ARCHITECTURE.md`](./ARCHITECTURE.md). The template root `baalvion/` = the locked
**`Backend/` root** (same thing; no competing root name introduced).

```
Backend/                         ← the one backend monorepo root
  services/
    identity/        auth-service · oauth-service · session-service
    commerce/        trade · order · inventory · fulfillment · commerce · market
    knowledge/       imperialpedia · cms · law · ml (Python)
    infrastructure/  realtime · notification · proxy-service (was backend-Proxy-BaalvionStack)
    platform/        admin · dashboard
    ecosystem/       about · brand-connector · ctm · insiders · elite-circle ·
                     ir · jobs · mining · real-estate · law-elite (sub-stack kept whole)
  gateway/           Go — the ONE public ingress (domain: infrastructure, not under services/)
  platform/          baalvion-os (Prisma kernel) · cli (baalctl)
  packages/          shared backend libs (@baalvion/* — auth-node, contracts, events, rbac, …)
  catalog/           service registry + governance gate (validate.mjs + enforce.mjs)
  database/          shared migrations + seeds (each service still owns its own DB)
  infra/             docker / k8s / helm / terraform + clickhouse & timeseries projections
```

**Rules satisfied:** one home per service; no duplication; no mixed-domain folders; `gateway/` is the lone ingress;
frontends stay in `Frontend/`; shared libs imported by `@baalvion/*` workspace name (not relative paths).

**Reconstruction decisions forced by Step 3:**
- `backend-Proxy-BaalvionStack` → rename to `infrastructure/proxy-service`; collapse proxy-platform/proxy-gateway into one owned context.
- `insiders` / `elite-circle` twins → keep both homes (distinct products/DBs) **but** extract shared logic into a `packages/*` lib to kill the byte-clone.
- `law-elite` → kept whole under `ecosystem/` as an acquired sub-stack; its internal `gateway`/`user`/`payment` flagged for de-duplication against the platform gateway/Identity/Commerce over time (tracked, not blind-moved).
- `ml-service` (Python) → first-classed as a polyglot service under `knowledge/` with its own (Python) build lane.
- Global-Trade-Infrastructure embedded backend/infra → reconciled out of the UI into `trade-service` + `infra/` (**reconciliation pass, not a blind move**).

---

## STEP 5 — MIGRATION EXECUTION PLAN

Implemented as [`MIGRATION.md`](./MIGRATION.md). Build model is now **stable (pnpm workspace, Option A)**, so batches are unblocked.

### Ordering (low-risk leaf → high blast-radius)

| Batch | Services | Why this order |
|---|---|---|
| **0 (done)** | about-service | Self-contained leaf — proved the move + build model |
| **1** | ecosystem (brand-connector, ctm, insiders, elite-circle, ir, jobs, mining, real-estate, law-elite) | Few inbound deps; widest domain; law-elite moves whole |
| **2** | knowledge (imperialpedia, cms, law, ml-Python) | Low inbound coupling |
| **3** | commerce (trade, order, inventory, fulfillment, commerce, market) | Revenue path; moderate coupling |
| **4** | infrastructure (realtime, notification, proxy-service) | Transport/edge; `gateway/` (Go) stays top-level |
| **5** | platform (admin, dashboard; relocate baalvion-os + cli) | Control plane + kernel |
| **6** | identity (auth, oauth, session) | **tier-0 — move LAST, most verification** |
| **7** | shared roots (packages/catalog/infra/migrations under Backend/) | Highest blast radius — changes the import root |

**Must move first:** leaves with no dependents (ecosystem).
**Must NOT be touched yet:** `identity/*` (tier-0) and the shared roots (Batch 7) until everything imports by `@baalvion/*` workspace name.
**Polyglot caveat:** `ml-service` uses the Python lane, not pnpm.

### Per-batch procedure (build-breakage prevention)
`git mv` (move `node_modules` aside first on Windows to dodge watcher locks) → convert any `../../../packages/*` to
`@baalvion/*: workspace:*` → `corepack pnpm install` → update catalog `path:` + docker-compose/pm2/CI path filters +
monorepo Dockerfile → **validation gate:** `pnpm run architecture:check` green + `node --check` +
`turbo run build --filter=<svc>...`.

### Strategy / rollback / validation
- **Batch strategy:** one domain (or the first service of a domain) per independent, revertible commit; never two domains in one commit.
- **Rollback:** each batch = a single `git revert`; `pnpm-lock` regenerated by `corepack pnpm install`; `git mv` rename-tracking restores old paths cleanly.
- **Validation after each batch:** architecture gate (39/0) + workspace build of moved service(s) + smoke of any test harness. **Do not proceed on a red gate.**

---

## STEP 6 — ARCHITECTURE GOVERNANCE RULES

Machine-enforced (CI-blocking) in [`catalog/enforce.mjs`](../catalog/enforce.mjs) + [`catalog/validate.mjs`](../catalog/validate.mjs).

| Rule | Enforced as | Mechanism |
|---|---|---|
| **MUST** one service = one domain = one DB | C1 + required `domain` | ≤1 system-of-record (Postgres only; ClickHouse/Timescale/Redis = projections); schema requires `domain` |
| **MUST** no cross-service imports | C2 | source scan: a Backend file importing into a sibling service fails CI (law-elite sub-stack exempt) |
| **MUST NOT** duplicate auth systems | C3 + C6 | `jsonwebtoken` only in `@baalvion/auth-node` + `packages/middleware` + a finite, ratcheting allowlist |
| **MUST** gateway-only ingress | C4 | exactly one descriptor may declare `ingress: public`, and it must be the gateway |
| **MUST** comms via contracts/events | C5 | `dependsOn` resolves to known services; events exist in `packages/contracts` |
| **MUST** Prisma kernel-only | C7 | Prisma confined to `baalvion-os` |
| **MUST** catalog registration | CATALOG + SCAFFOLD | every deployable service has a schema-valid descriptor whose `path` exists |
| **MUST NOT** cross-service DB access | C2 (covers it) | no source path escaping into another service |
| **MUST NOT** mixed-domain services | required `domain` enum (single value) | one service = one domain folder |
| **MUST NOT** frontend↔backend coupling | structural (`Frontend/` vs `Backend/`) + `.dockerignore` | services under `Backend/services/<domain>`; UIs under `Frontend/` |
| **MUST NOT** bypass gateway | C4 | single public ingress |

**Command:** `npm run architecture:check` → currently **green: 39 services, 0 violations, all 9 checks (C1–C7 + CATALOG + SCAFFOLD).**

### Gaps to harden (honest)
- C2's `backendServiceOf` is now nested-layout-aware; the SCAFFOLD top-level loop should recurse `services/<domain>/*` as batches land.
- The 9 virtual `*-platform` contexts need either a code home or a "reserved" lifecycle flag.
- `law-elite`'s second gateway + internal user/payment violate C4/domain-purity in spirit and are allowlisted **pending de-duplication**.

---

## Outstanding decisions (reconciliation, not mechanical moves)

1. **Global-Trade-Infrastructure embedded backend** (`infrastructure/`, `libs/`, `prisma/`, `ai-runtime/`, compose) vs `trade-service` — overlapping; needs a reconciliation pass before extraction.
2. **`law-elite` internal gateway / user-service / payment-service** vs the platform gateway, Identity, and Commerce — de-duplicate over time; currently allowlisted.

**State:** fully mapped (30 real units + 9 reserved contexts, zero unmapped) · domain-separated (6 domains, every
service assigned with reason) · migration-safe (verified Batch 0 + stable pnpm build model + enforced governance).
