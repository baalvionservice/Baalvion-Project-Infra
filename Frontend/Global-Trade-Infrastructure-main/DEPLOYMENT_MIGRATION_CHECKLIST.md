# Global-Trade-Infrastructure — Migration & Deployment Checklist

> Production deployment runbook for the GTI Next.js app (Prisma + PostgreSQL).
> This app is the only frontend in the fleet with its **own database** — migrations
> are a hard pre-readiness gate. Generated as part of the final frontend hardening pass.

## 1. Prisma configuration (verified)

| Item | Status | Detail |
|------|--------|--------|
| `datasource db.url` | ✅ env-driven | `env("DATABASE_URL")` — no hardcoded/localhost fallback in `prisma/schema.prisma`. |
| `generator client` | ✅ | `prisma-client-js` (default `native` binary target → `linux-musl-openssl-3.0.x` on the alpine builder/runner pair). |
| Client generation | ✅ wired | `postinstall` and `build` both run `prisma generate`. |
| Standalone tracing | ✅ | `output: 'standalone'` (Linux/CI); `server.js` is emitted nested under `Frontend/Global-Trade-Infrastructure-main/` — confirming Next traces from the monorepo root (hoisted `node_modules` is in-scope). |
| Schema + migrations in image | ✅ | Dockerfile copies `prisma/` into the runner for a `migrate deploy` sidecar/job. |
| Production migrate command | ✅ added | `pnpm prisma:deploy` (`prisma migrate deploy`) + `pnpm prisma:status`. |

## 2. Migrations present (apply in order)

`prisma/migrations/`:
1. `20260610100130_init`
2. `20260610104013_add_compliance_finance`
3. `20260611090000_tenant_isolation_outbox_appendonly`

All three must be applied before the service is marked healthy (the `/api/health` probe touches the DB).

## 3. Required runtime secrets (no localhost fallback in prod)

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | **YES** | `postgresql://USER:PASS@HOST:5432/DB?schema=public&sslmode=require`. No app fallback — process fails without it. |
| `GATEWAY_SIGNING_SECRET` | **YES** | ≥32 chars. `src/server/http/identity.ts` **throws in production** if missing/short/dev-default (fail-fast — verified). |
| `GATEWAY_PROXY_TARGET` | **YES** | auth-gateway origin. Now dev-guarded: no localhost baked into the prod routes manifest. Must be present at **build time** (rewrite destinations are baked at build). |

## 4. Required build args (`NEXT_PUBLIC_*`, baked at build)

| Build arg | Example |
|-----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.baalvion.com/api/v1/ecosystem/trade/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://trade.baalvion.com` |
| `NEXT_PUBLIC_TELEMETRY_INGEST` | (optional) |

## 5. Deployment order of operations

```
[ ] 1. Provision RDS PostgreSQL; create the DB + app role; enforce SSL (sslmode=require).
[ ] 2. Put DATABASE_URL, GATEWAY_SIGNING_SECRET (≥32), GATEWAY_PROXY_TARGET in Secrets Manager.
[ ] 3. Build the image RECURSIVELY (this app is a git submodule) with the NEXT_PUBLIC_* + GATEWAY_PROXY_TARGET build args.
[ ] 4. Run migrations from an image/job that HAS the Prisma CLI (the builder/installer stage or a one-off task):
          DATABASE_URL=... pnpm prisma:deploy
       NOTE: the minimal runner image does NOT carry the Prisma CLI (devDependency) —
       only the schema+migrations are copied for a sidecar. Do NOT expect `migrate deploy`
       to run inside the runner container.
[ ] 5. Verify: DATABASE_URL=... pnpm prisma:status   → "Database schema is up to date!"
[ ] 6. Start the app task; wait for the HEALTHCHECK (GET /api/health, which hits the DB) to go green.
[ ] 7. Smoke: load a data page + the login/refresh flow through /trade-bff.
```

## 6. Verify the standalone build actually contains the Prisma client (run on the Linux/CI build artifact)

```bash
# 1. The query-engine binary must be present in the standalone bundle:
find .next/standalone -name 'libquery_engine-*.so.node' -o -name 'query-engine-*' | head
#    → expect at least one linux-musl engine. If EMPTY, the engine was not traced — see fallback below.

# 2. The generated client must be present:
find .next/standalone -path '*/.prisma/client/index.js' | head

# 3. Boot the standalone server and hit health (requires a reachable DATABASE_URL):
node Frontend/Global-Trade-Infrastructure-main/server.js &
curl -fsS http://127.0.0.1:9003/api/health    # 200 == DB reachable + client loaded
```

**Fallback if the engine is missing from `.next/standalone`** (add to `next.config.ts`, then rebuild and re-run the check above):

```ts
// Next 15: top-level key. Globs are project-dir-relative; adjust if pnpm hoists .prisma to the workspace root.
outputFileTracingIncludes: {
  '/**': ['./node_modules/.prisma/client/**/*', './node_modules/@prisma/client/**/*'],
},
```

## 7. Non-prod localhost references (verified safe — do not ship to prod)

All remaining `localhost`/`127.0.0.1` in this app are dev/test/script-only and are **not** in production code paths:
- `next.config.ts` CSP dev relaxation (`isDev`-gated), `API_URL` dev default, `GATEWAY_PROXY_TARGET` (now dev-guarded).
- `vitest.config.ts` / `src/server/test/global-setup.ts` / `scripts/migrate-init.cjs` — embedded-postgres on `127.0.0.1:5543x` (tests/scripts only).
- `src/app/api/sanctions/screen/route.ts` `SANCTIONS_API_URL` dev default — set this in prod if sanctions screening is enabled.
- `Dockerfile` HEALTHCHECK probes `127.0.0.1` **inside** the container (correct).
