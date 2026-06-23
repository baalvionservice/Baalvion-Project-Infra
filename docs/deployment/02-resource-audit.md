# 02 · Resource Audit

Idle-RAM classification and consolidation options for all 45 services.

> **Methodology — read this first.** The MB figures are **derived idle-RSS estimates** from each
> service's runtime + dependency stack (Node/Express+Sequelize baseline ≈ 80–110 MB; then
> +BullMQ workers, +Redis, +geoip-lite, +Neo4j pool, +Elasticsearch client, +JVM, +Python/numpy
> each add known increments). They are for **relative bucketing and capacity planning**, not
> billing-grade truth. Validate any number that drives a sizing decision with
> `docker stats --no-stream` or `pm2 jlist`. Cross-check: the running fleet's capped limits total
> ~4.94 GB, which corroborates the ~5 GB Node figure below.

## 1–3. RAM classification

### 🟢 Light — under 150 MB (28 services)
Plain Express + Sequelize CRUD, no background workers or heavy in-process clients.

`dashboard-service` (80) · `platform/realtime-service` (75) · `about-service` (85) ·
`brand-connector-service` (85) · `imperialpedia-service` (85) · `inventory-service` (85) ·
`fulfillment-service` (85) · `product-registry-service` (85) · `quality-inspection-service` (85) ·
`crm-service` (90) · `market-service` (90) · `mining-service` (90) · `real-estate-service` (90) ·
`rbac-service` (90) · `oauth-service` (90) · `auth-gateway` (90) · `supplier-lifecycle-service` (90) ·
`trade-documentation-service` (90) · `agent-service` (95) · `insiders-service` (95) ·
`ir-service` (95) · `admin-service` (95) · `tenant-service` (95) · `audit-service` (95) ·
`developer-service` (95) · `ctm-service` (100) · `infrastructure/realtime-service` (110) ·
`session-service` (120) · `search-service` (120) · `report-service` (120)
*(`law-elite` ≈ 50 MB — shell, decommissioned)*

### 🟡 Medium — 150–300 MB (12 services)
Background workers, websockets, Neo4j pools, or an Elasticsearch client.

| Service | ~MB | Driver |
|---|---:|---|
| commerce-service | 160 | BullMQ + Redis |
| network-graph-service | 160 | Neo4j 50-conn pool |
| auth-service | 160 | bcrypt + speakeasy + geoip + nodemailer |
| order-service | 170 | reconciliation worker |
| cms-service | 170 | BullMQ media pipeline |
| law-service | 170 | multer + S3 + WS + billing worker |
| trade-service | 190 | ws + doc/logistics engines + S3 + RLS |
| order-execution-service | 190 | 5 background workers |
| notification-service | 200 | 5 BullMQ workers + dual email |
| proxy-service | 220–280 ⚠ | socket.io + 4 payment gateways + S3 + SAML |
| jobs-service | 250–300 ⚠ | Elasticsearch client + 4 workers + Bull-Board |

⚠ `proxy-service` and `jobs-service` can cross 300 MB under load — treat as the watch list.

### 🔴 Heavy — over 300 MB (2 services)
| Service | ~MB | Driver |
|---|---:|---|
| ml-service | 300–400 | Python + numpy/scikit-learn/statsmodels, 2 uvicorn workers |
| financial-services-java | 400–700+ | Spring Boot 4.1 JVM + spring-kafka + HikariCP (heaviest by far) |

**Takeaway:** the entire RAM problem is concentrated in **two non-Node services** plus a handful of
worker-heavy Node BFFs. Everything else is cheap.

## 4. AWS Lambda candidates (rarely used / bursty / stateless)

| Candidate | Why | Trigger |
|---|---|---|
| report-service | Report/Excel/PDF generation is bursty + async | SQS / EventBridge |
| notification-service | Already a queue-worker model | SQS → Lambda (+ SES/SNS) |
| audit-service | Append-only event ingestion | SQS → Lambda |
| ir-service, insiders-service | Very low-traffic investor/founder portals | API Gateway (HTTP) |
| brand-connector, crm-service, agent-service | Internal/low-volume CRUD | API Gateway (HTTP) |
| developer-service | Infrequent dev-portal / API-key issuance | API Gateway (HTTP) |
| about-service, imperialpedia-service | Mostly cached content reads | Edge cache → Lambda fallback |
| law-elite | Demo shell | **Delete instead** |

**Do NOT Lambda:** auth-service/gateway/session/oauth/rbac (login latency), proxy-service + both
realtime-services (long-lived websockets), financial-services-java (JVM cold starts), ml-service
(numpy cold start), and the order/trade transactional chain.

**Recommendation:** defer HTTP-Lambda. At this scale, HTTP Lambdas behind API Gateway add
cold-start latency and a Postgres connection-exhaustion problem (Sequelize/`pg` need **RDS Proxy**).
The Lambda win worth taking now is the **async/bursty path only** — report generation, notification
dispatch, audit ingestion via SQS/EventBridge.

## 5. Merge analysis — keep modules separate, deploy together

43 of 45 services share one stack, one Postgres, and `@baalvion/auth-node`, so they can be packaged
into a few deployables. Two runtime models were considered:

| Model | Mechanism | RAM | Code change | Boundary risk |
|---|---|---|---|---|
| **A. Single process** | mount each service's Express router under a path prefix in one Node process | ~2 GB (shared runtime + 1 pool) | **~42 entrypoint edits** | global-state sharing |
| **B. Multi-process per container** *(chosen)* | one image; `pm2-runtime` runs each module's own `node index.js`, grouped by context | ~5 GB Node | **none** | none — own port/pool/lifecycle |

### Why B (the boot-pattern finding)
Service entrypoints self-start on import, inconsistently:
- `auth-gateway` — composition-safe: `if (require.main === module) { app.listen() }` + `module.exports = app`.
- `about-service`, `auth-service` — export `app` **but call `start()` at import** (binds port, creates
  schema, starts workers).
- `commerce-service` — calls `start()` at import and exports nothing.

Model A would therefore require guarding `start()` behind `require.main === module` and exporting the
app in **~42 files** — a bootstrap change that also collapses 42 services' Sequelize model
registrations, telemetry bootstraps, and worker lifecycles into one process (collision-prone). That
conflicts with the "no changes / boundaries intact" requirement, so **Model B is used**. Model A
remains the documented lever to reach ~2 GB (one t4g.small) if the constraint is later relaxed —
see [05 · Capacity & Cost](05-capacity-and-cost.md).

➡ Next: [03 · Consolidation Architecture](03-consolidation-architecture.md)
