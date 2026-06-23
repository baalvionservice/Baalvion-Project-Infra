# 10 · Service Deployment Groups

Production deployment classification for the whole system, derived from the cross-container
dependency map ([08](08-service-dependency-map.md)), the boot-dependency audit, and the messaging
audit. **Architectural caveat:** the consolidated stack groups services into **6 Node containers +
1 JVM**, so you deploy/skip at *container* granularity — a service's group tells you whether its
container is essential, but you can't run half a container. The `Container` column maps each service
to its pm2 group ([../03-consolidation-architecture.md](../03-consolidation-architecture.md)).

Dependency shorthand: `PG`=PostgreSQL · `R`=Redis · `N`=Neo4j · `K`=Kafka · `OS`=OpenSearch.

## Group 1 — CORE PRODUCTION (must run; system breaks without these)

| Service | Container | Purpose | Dependencies | Disable? |
|---|---|---|---|---|
| **auth-service** | identity | RS256 token issuer; login/register/OTP/social | PG, R, SES, cms(vault) | **No** — whole fleet verifies its tokens |
| **auth-gateway** | identity | session/CSRF + auth proxy + BFF routing | auth-service, R | **No** |
| **rbac-service** | identity | roles/permissions source of truth | PG | **No** — order-service `failMode=closed` → checkout breaks |
| **cms-service** | platform | content delivery + payment provider-key **vault** | PG, R | **No** — vault + content; prod guard rejects localhost |
| **commerce-service** | commerce | product catalog / storefront read | PG, R, rbac | No (if commerce live) |
| **order-service** | commerce | cart / checkout / orders / payments | PG, R, rbac, inventory, notif, cms, gateways | **No** — revenue path |
| **proxy-service** | edge-realtime | consumer/admin BFF (`api.baalvion.com`) | auth, payment, R, S3, cms | **No** — frontends' API entrypoint |
| **admin-service** | platform | admin console backend (`admin.baalvion.com`) | PG, rbac, DB_PASSWORD (hard) | No — platform operations |
| **PostgreSQL (RDS)** | infra | all domain data (schema-per-domain) | — | **No** |
| **Redis** | infra | sessions, BullMQ queues, cache | — | **No** |
| **Caddy** | infra | edge TLS + routing (sole ingress) | — | **No** |

## Group 2 — SUPPORT (recommended; degrades if off)

| Service | Container | Purpose | Dependencies | Disable? |
|---|---|---|---|---|
| **notification-service** | edge-realtime | email/SMS/push/webhook dispatch + `/email/sync` | PG, R, SES | Partial — order/alert emails lost (fail-open) |
| **inventory-service** | commerce | oversell reservation guard | PG, rbac | Yes — order fails *open* (oversell risk) |
| **session-service** | identity | login session enrichment (geo/device/risk) | PG | Yes — auth works without enrichment |
| **oauth-service** | identity | OAuth/SSO provider | PG | Yes — SSO degrades, password works |
| **payment-service (JVM)** | payments | double-entry ledger/transaction engine | PG, K | **Yes** for consumer checkout (Node gateways); **No** for finance/ledger path |
| **tenant-service** | platform | multi-tenant orgs/tenants | PG | Yes (if single-tenant) |
| **dashboard-service** | platform | dashboards / analytics | PG | Yes |
| **search-service** | platform | search API | PG, OS | Yes — degrades to DB / 503 |
| **realtime-infra** | edge-realtime | socket.io fan-out (`ws.baalvion.com`) | R | Yes — realtime degrades |
| **fulfillment-service** | commerce | order fulfillment / shipping | PG, rbac | Yes |
| **Product verticals** (ctm, ir, about, imperialpedia, law, mining, real-estate, crm, insiders, agent, brand-connector, market, marketplace, trade-service) | ecosystem / commerce / platform | per-product surfaces | PG (+gateways/S3 per svc) | **Yes** — enable only products you run |
| **GTI trade tier** (network-graph, order-execution, product-registry, quality-inspection, supplier-lifecycle, trade-documentation) | trade | Global Trade Infrastructure | PG, R, **N (network-graph hard-exits)**, cms | **Yes** — disable whole app-trade if GTI not live |
| **SES** | infra(ext) | transactional email | — | Recommended |
| **S3** | infra(ext) | media (cms/law/trade) | — | Recommended (lazy) |
| **Neo4j** | infra | graph for network-graph-service | — | Yes — only if app-trade deployed |
| **Kafka / MSK** | infra | payment JVM event bus | — | Yes — only if JVM/finance deployed |
| **OpenSearch** | infra(ext) | search/jobs backend | — | Yes — degraded mode without it |
| **ml-service** | excluded | optional Python scoring accelerator | — | Yes — Node in-process fallback |

## Group 3 — BACKGROUND / ASYNC ONLY (Kafka consumers, jobs, workers)

> In the consolidated stack, Node workers run **in-process** with their parent service container
> (no separate worker deployable). Only the Java reactor consumers are independent processes.

| Workload | Where | Purpose | Dependencies | Disable? |
|---|---|---|---|---|
| **report-service** | platform | PDF/Excel report generation (bursty) | PG | Yes — Lambda candidate |
| **audit-service** | platform | append-only audit ingestion | PG | Recommended (compliance) |
| **realtime-platform** | edge-realtime | platform WS telemetry | R | Yes |
| **notification workers** (×5) | in notification-service | email/sms/push/webhook/notification queues | R, SES | component of a Group 2 svc |
| **jobs-service workers** (×4) | in jobs-service | ES index / scoring / resume / email | R, OS | Yes — careers vertical |
| **order reconciliation worker** | in order-service | nightly payment/ledger reconciliation sweep | PG, R | component of a Group 1 svc |
| **Java finance reactor** (ledger, settlement, escrow, account, invoice, fx, credit, aml, risk, dispute, wallet, trade-finance, payment-rails, smart-contract … 21 modules) | not in consolidated | Kafka outbox/saga event processors | PG, K | **Yes** — not in MVP; full GTI trade-finance only |

## Group 4 — DEV ONLY (must NOT be deployed to AWS prod)

| Item | Purpose | Note |
|---|---|---|
| **Mailpit / MailHog** | dev SMTP catcher | replaced by SES; preflight blocks `SMTP_HOST=mailpit` in prod |
| **docker-compose.dryrun.yml** + throwaway Postgres | local dry-run overlay | gitignored; never layered on prod compose |
| **dryrun-keys/** (test JWT pair + self-signed SMTP cert) | local test material | gitignored |
| `NODE_TLS_REJECT_UNAUTHORIZED=0`, `DEPLOY_PROFILE=dryrun`, `PSP_MOCK=true` | dry-run flags | preflight hard-fails on these in a non-dryrun profile |
| **law-elite** | in-memory demo shell | decommission (excluded from all packaging) |
| **pgAdmin / `tools` profile** | local DB admin | dev only |

*(Frontends — Amarisé, admin-platform, CTM, GTI, etc. — are a separate deploy track (Vercel/ECR+CDN), not part of these backend groups.)*

## Minimum Viable Production Set (MVP AWS stack)

Auth + consumer commerce + content, smallest functional footprint.

- **Containers:** `app-identity` + `app-commerce` + `app-platform` + `app-edge-realtime` (4 of 6)
- **Services that matter:** auth, auth-gateway, rbac, session · commerce, order, inventory, fulfillment · cms, admin, notification · proxy
- **Infra:** RDS Postgres, Redis, Caddy, SES, S3
- **NOT needed:** `app-trade`, `app-ecosystem`, `app-payments (JVM)`, **Kafka, Neo4j, OpenSearch** — consumer checkout uses Node gateway adapters (Razorpay/PayU/Stripe), not the JVM.
- **Footprint:** ~2.3–2.8 GiB idle (4 containers) → a `t3.medium` (4 GB) or `t3.large`.

## Recommended Production Set (full stack)

- **All 6 Node containers + `app-payments` JVM** (`--profile payments`).
- **Infra:** RDS Multi-AZ, Redis (→ ElastiCache at scale), Neo4j (app-trade), Kafka/MSK (JVM),
  OpenSearch (non-degraded search), SES, S3, Caddy.
- **Enable only the product verticals you run** (ctm, ir, about, law, …) — the rest stay dark inside
  `app-ecosystem` without harm.
- **Footprint:** ~4.6 GiB idle → `t3.large` (8 GB); `t3.xlarge` headroom. = the full consolidated
  stack validated locally.

> To slim the MVP **below** container granularity (drop individual modules), add a pm2 config variant
> (e.g. a `commerce-mvp.config.js` omitting trade-service/marketplace) and a matching compose service.
