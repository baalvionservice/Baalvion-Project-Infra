# 01 · Service Inventory

All 45 services under `Backend/services/<domain>/<service>/`, audited from their
`package.json` / `pom.xml` / `app/main.py`, entrypoints, and route directories.

**Runtime split:** 43 Node.js (Express 4/5 + Sequelize), 1 Java (Spring Boot), 1 Python (FastAPI).
**Real vs shell:** 44 real services, 1 shell (`law-elite` — in-memory demo).

## Full inventory

| Domain | Service | Runtime | Framework | Port | Status | Notable / heavy deps |
|---|---|---|---|---:|---|---|
| commerce | commerce-service | Node 20 | Express 5 | 3012 | Real | BullMQ, Sequelize, ioredis, media uploads |
| commerce | financial-services-java | Java 17 | Spring Boot 4.1 | 3015 | Real | **spring-kafka, HikariCP, Resilience4j** (22 modules) |
| commerce | fulfillment-service | Node 20 | Express 5 | 3016 | Real | Sequelize, ioredis |
| commerce | inventory-service | Node 20 | Express 5 | 3014 | Real | Sequelize, ioredis |
| commerce | market-service | Node 20 | Express 5 | 3007 | Real | Sequelize, prom-client |
| commerce | order-service | Node 20 | Express 5 | 3013 | Real | BullMQ reconciliation worker, @baalvion/events |
| commerce | trade-service | Node 20 | Express 5 | 3025 | Real | BullMQ, ws, @aws-sdk/s3, doc/logistics engines, RLS |
| ecosystem | about-service | Node 20 | Express 5 | 3010 | Real | Sequelize (CMS content) |
| ecosystem | agent-service | Node 20 | Express 5 | 3044 | Real | Sequelize, ioredis (leaderboards) |
| ecosystem | brand-connector-service | Node 20 | Express 5 | 3006 | Real | Sequelize |
| ecosystem | crm-service | Node 20 | Express 5 | 3063 | Real | Sequelize, prom-client |
| ecosystem | ctm-service | Node 20 | Express 5 | 3017 | Real | Razorpay + Stripe SDKs, Swagger UI |
| ecosystem | insiders-service | Node 20 | Express 4 | 3050 | Real | Sequelize, Multer, bcryptjs |
| ecosystem | ir-service | Node 20 | Express 5 | 3008 | Real | Sequelize, prom-client (19 route modules) |
| ecosystem | jobs-service | Node 20 | Express 5 | 3002 | Real | **Elasticsearch 9**, BullMQ ×4 workers, S3, Bull-Board |
| ecosystem | law-elite | Node 20 | Express 4 | 3001/3002 | **Shell** | none — two in-memory demo apps, mock arrays |
| ecosystem | mining-service | Node 20 | Express 5 | 3003 | Real | Sequelize, prom-client (9 route modules) |
| ecosystem | real-estate-service | Node 20 | Express 5 | 3005 | Real | Sequelize, prom-client |
| identity | auth-gateway | Node 20 | Express 4 | 3026 | Real | ioredis, http-proxy-middleware (trust boundary BFF) |
| identity | auth-service | Node 20 | Express 5 | 3001 | Real | bcrypt, jsonwebtoken (RS256), speakeasy, qrcode, geoip-lite, nodemailer |
| identity | oauth-service | Node 20 | Express 5 | 3023 | Real | OIDC/OAuth2 server; bcrypt, jwt, pino |
| identity | rbac-service | Node 20 | Express 5 | 3053 | Real | Sequelize, jwt (RLS tenant isolation) |
| identity | session-service | Node 20 | Express 5 | 3022 | Real | geoip-lite, ua-parser, ioredis |
| infrastructure | audit-service | Node 20 | Express 5 | 3032 | Real | Sequelize, ioredis, pino (event consumer) |
| infrastructure | developer-service | Node 20 | Express 5 | 3042 | Real | Sequelize, ioredis, pino |
| infrastructure | notification-service | Node 20 | Express 5 | 3031 | Real | BullMQ ×5 workers, nodemailer + resend, Twilio/Firebase (optional) |
| infrastructure | proxy-service | Node 20 | Express 5 | 4000 | Real | **socket.io, Razorpay/Stripe/PayU/Cashfree, S3, SAML/OpenID** (consumer BFF) |
| infrastructure | realtime-service | Node 20 | Express 4 | 3040 | Real | socket.io, Redis pub/sub |
| infrastructure | report-service | Node 20 | Express 5 | 3041 | Real | Sequelize, exceljs + pdfkit (lazy) |
| infrastructure | search-service | Node 20 | Express 5 | 3036 | Real | @baalvion/search (OpenSearch), ioredis |
| knowledge | cms-service | Node 20 | Express 5 | 3018 | Real | BullMQ media pipeline, Sequelize, ioredis |
| knowledge | imperialpedia-service | Node 20 | Express 5 | 3004 | Real | Sequelize, prom-client |
| knowledge | law-service | Node 20 | Express 5 | 3015 | Real | Multer, S3, WebSocket, nodemailer, billing worker |
| knowledge | ml-service | Python 3.11 | FastAPI/uvicorn | 8000 | Real* | **scikit-learn, statsmodels, numpy, joblib** (2 workers) |
| marketplace | marketplace-service | Node 20 | Express 5 | 3060 | Real | Sequelize, Zod (cap tables/deals) |
| platform | admin-service | Node 20 | Express 5 | 3021 | Real | Sequelize, Redis, pino (super-admin + feature flags) |
| platform | dashboard-service | Node 20 | Express 5 | 3009 | Real | Sequelize (aggregation layer) |
| platform | realtime-service | Node 20 | hand-rolled WS (RFC6455) | 3026 | Real | pg, Redis, jwt (no ws lib) |
| platform | tenant-service | Node 20 | Express 5 | 3043 | Real | Sequelize, Redis (white-label registry) |
| trade | network-graph-service | Node 20 | Express 5 | 3047 | Real | **neo4j-driver** (50-conn pool) |
| trade | order-execution-service | Node 20 | Express 5 | 3052 | Real | outbox/saga/reconciliation/redrive workers |
| trade | product-registry-service | Node 20 | Express 5 | 3048 | Real | Sequelize (SKU/GTIN/HS master) |
| trade | quality-inspection-service | Node 20 | Express 5 | 3050 | Real | Sequelize (AQL sampling) |
| trade | supplier-lifecycle-service | Node 20 | Express 5 | 3051 | Real | Sequelize (calls network-graph + trust-score) |
| trade | trade-documentation-service | Node 20 | Express 5 | 3049 | Real | Sequelize, S3 (no headless browser) |

\* `ml-service` is an **optional accelerator** — Node callers fall back to in-process inference when it is absent.

## Findings that affect packaging

- **`law-elite` is not production code** — two in-memory Express 4 demo apps (mock arrays, no DB,
  no auth). **Decommission**; it is excluded from all deployable apps.
- **Port collisions exist** across the raw fleet and must be resolved before single-host packing:
  - `3026` — `auth-gateway` **and** `platform/realtime-service`
  - `3002` — `jobs-service` **and** `law-elite/user-service`
  - `3015` — `financial-services-java` **and** `law-service`
  - `3050` — `insiders-service` **and** `quality-inspection-service`
  These are resolved in packaging by (a) placing colliding services in **different containers**
  (separate network namespaces) and (b) where two land in the same container, remapping one via
  the pm2 `PORT` env (e.g. `platform/realtime-service` → `3046`).
- **Two `realtime-service` directories** exist (infra socket.io `:3040`, platform hand-rolled WS
  `:3026`). They are distinct services; in pm2 they are named `realtime-infra` / `realtime-platform`.
- **Homogeneous stack** — 43 of 45 services share Node 20 + Express + Sequelize + ioredis +
  `@baalvion/*` workspace packages, which is what makes one shared image viable.

➡ Next: [02 · Resource Audit](02-resource-audit.md)
