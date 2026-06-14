# GTOS Trade Services — Scaffold

Six bounded-context services for the Global Trade Operating System. Scaffolded per
the platform conventions of `Backend/services/commerce/trade-service` (Express 5 +
Sequelize, `@baalvion/auth-node` RS256-only, `@baalvion/tenancy` RLS, `@baalvion/sdk`
events over Redis Streams `baalvion:events`). Aligns to
`docs/architecture/GTOS/07-implementation-execution-plan.md`.

| Service | Port | Store | Schema | Purpose |
|---------|------|-------|--------|---------|
| network-graph-service | 3047 | Neo4j 5 | (graph) | Relationship graph, sanctions path-finding, visibility gating |
| product-registry-service | 3048 | Postgres | `product` | Product/HS-code master + doc requirements |
| trade-documentation-service | 3049 | Postgres + S3 | `tradedoc` | Invoice/B-L/CoO/LC docs, e-sign, dossier |
| quality-inspection-service | 3050 | Postgres | `quality` | Inspection orders, AQL, defects, CAPA |
| supplier-lifecycle-service | 3051 | Postgres | `supplier` | Onboarding → qualification → scorecard → offboarding |
| order-execution-service | 3052 | Postgres | `trade` | Order lifecycle state machine + transactional outbox + payment→order saga (R3) |

## Folder structure (per service)

```
<service>/
├── package.json            workspace deps (@baalvion/auth-node|tenancy|sdk)
├── .env.example            full env schema
├── Dockerfile              repo-root turbo-prune build
├── ecosystem.config.js     pm2 process def
├── migrate.js              SQL runner (Postgres) / Cypher runner (graph)
├── index.js                Express boot + /health, /health/live, /health/ready
├── config/appConfig.js     env-driven config (+ neo4j.js for the graph service)
├── middleware/             requestContext, error, auth (RS256+gateway), tenant (RLS), rateLimit
├── utils/                  response, errors
├── models/                 Sequelize models + GUC-bridge index.js  (graph: graph/queries.js)
├── migrations/             001_init.sql (+ RLS policies) / 001_constraints.cypher
├── routes/                 v1.js + domain routes
├── controller/             request handlers (zod-validated)
├── services/               pure domain logic (saga, lifecycle, projection, outbox publisher)
├── platform/               sdk.js (single SDK instance) + events.js (producer catalog)
└── workers/eventConsumer.js  sdk.events.subscribe consumer (idempotent, trace-scoped)
```

## Conventions applied

- **R1 isolation:** every tenant table has `ENABLE + FORCE ROW LEVEL SECURITY`; services
  connect as `baalvion_app` (non-superuser); `models/index.js` patches `sequelize.transaction`
  to set `app.current_tenant`/`app.tenant_bypass` from the request ALS context.
- **R2 auth:** `middleware/auth.js` accepts only RS256 (JWKS) or HMAC gateway identity — no HS256.
- **R3 consistency:** `order-execution-service` writes business row + `outbox_events` in one
  transaction; `outboxPublisher` is the sole publisher (publish-iff-commit); `processed_webhooks`
  gives crash-safe idempotency; the finance webhook + bus consumer cascade payment → order state.
- **Events:** `gtos.<domain>.<entity>.<verb>.<version>` over `baalvion:events`. Money-critical
  flows use the outbox; non-critical domain events use fire-and-forget `emitSafe` (fail-open).

## Run locally

```bash
# 1. Prereq: P0-1 app role + schemas. Migrations run as the privileged owner role.
#    psql "$ADMIN_DATABASE_URL" -v app_pw=... -f Backend/database/migrations/027_app_role.sql
# 2. Per service:
cd Backend/services/trade/<service>
cp .env.example .env
MIGRATION_DB_USER=baalvion node migrate.js   # owner role for DDL/RLS
pnpm install --filter <service>...           # or NODE_PATH reuse, see commerce convention
node index.js                                # boots on its port

# Or all six via pm2:
pm2 start Backend/services/trade/ecosystem.gtos.config.js

# Or Docker (shared postgres+redis must be up):
docker compose -f Backend/services/trade/docker-compose.gtos.yml up -d
```

## Wiring TODO (post-scaffold)

- Register services in the service catalog + gateway routes (`/v1/network`, `/v1/products`,
  `/v1/trade-docs`, `/v1/quality`, `/v1/suppliers`, `/v1/orders`).
- Add to `pnpm-workspace.yaml` so `workspace:*` deps resolve.
- Frontend nav (GTOS doc 02): Network, Products, Trade Docs, Quality, Suppliers.
- trade-documentation: implement S3 persistence of the issued snapshot (WORM at V2).
- network-graph: backfill nodes/edges from existing order/supplier/product rows.
