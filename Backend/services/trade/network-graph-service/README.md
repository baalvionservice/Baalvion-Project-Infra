# network-graph-service

GTOS trade relationship graph (Neo4j): supplier/buyer network, sanctions
path-finding, and tenant-scoped visibility gating. The graph is a **derived read
model** projected from authoritative domain events — never a system of record.

## Surface

Auth (RS256 via `@baalvion/auth-node`, or gateway BFF HMAC identity) and tenant
resolution apply to every `/v1/*` route. All reads are scoped by the
ALS-derived `orgId`; only platform-bypass roles see across tenants.

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET`  | `/health`, `/health/live`, `/health/ready` | liveness / readiness (readiness verifies Neo4j) |
| `POST` | `/v1/nodes` | upsert an allowlisted graph node |
| `POST` | `/v1/edges` | create an allowlisted edge |
| `GET`  | `/v1/nodes/:id/neighbors` | 1-hop neighbors (`?direction=in\|out\|both`, `?type=`) |
| `GET`  | `/v1/paths` | shortest path (`?fromId=&toId=&maxHops=`) |
| `GET`  | `/v1/sanctions/path/:orgId` | sanctions exposure (super_admin / compliance_officer / admin) |
| `POST` | `/v1/query` | dispatch an **allowlisted** Cypher template by key (`{ template, params }`) |

Routes are mounted under both `/v1` and `/api/v1`.

### `/v1/query` templates

Only allowlisted template keys reach the driver (injection-safe — no free-form
Cypher): `neighbors`, `shortestPath`, `sanctionPath`. Unknown templates return
`422`.

## Required environment

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Purpose |
| -------- | ------- |
| `PORT` | HTTP port (default `3047`) |
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` / `NEO4J_DATABASE` | Neo4j connection |
| `JWKS_URI` / `JWT_ISSUER` / `JWT_AUDIENCE` | RS256 verification |
| `GATEWAY_SIGNING_SECRET` | gateway BFF identity HMAC secret |
| `EVENT_TRANSPORT` / `EVENT_STREAM` / `EVENT_CONSUMER_GROUP` / `REDIS_URL` | event bus / projection consumer |
| `CMS_BASE_URL` / `INTERNAL_SERVICE_SECRET` | platform SDK |
| `CORS_ORIGINS` / `RATE_LIMIT_IP_MAX` / `LOG_LEVEL` | HTTP hardening |

## Run

```bash
pnpm install            # from the monorepo root
cp .env.example .env    # then fill in real values

node migrate.js         # apply Neo4j constraints (idempotent)  — or: pnpm run migrate
pnpm run dev            # watch mode (nodemon)
pnpm start              # production start
```

## Migrate

`migrate.js` applies the `*.cypher` files in `migrations/` in order and records
applied ids on a `(:_Migration)` node. It is idempotent (constraints use
`IF NOT EXISTS`):

```bash
pnpm run migrate
```

## Test

Pure-logic unit tests run with the Node built-in test runner (no live Neo4j or
network required):

```bash
pnpm test
```
