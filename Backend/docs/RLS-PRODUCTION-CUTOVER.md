# RLS Production Cutover — making tenant isolation actually enforce

> Status: the **mechanism is complete**; enforcement is gated on a per-service cutover.
> This document is the operator runbook for that cutover.

## TL;DR

Postgres Row-Level Security (RLS) is **silently ignored for superusers and for the table
owner** (unless `FORCE ROW LEVEL SECURITY` is set — which our migrations do). Today every
service connects as the schema **owner** role `baalvion`, so RLS policies exist but do **not
filter anything**. RLS becomes real the moment a service connects as the non-superuser
`baalvion_app` role **and** sets the per-request tenant GUC.

Flipping `DB_USER` to `baalvion_app` **without** the GUC wiring makes every tenant query return
**zero rows** — so this is a staged, per-service, review-gated change, not a global default flip.

## What is already in place (no work required)

| Piece | Where |
|---|---|
| `baalvion_app` role: `LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE` | `Backend/database/migrations/027_app_role.sql` |
| Grants (`SELECT/INSERT/UPDATE/DELETE`) + `ALTER DEFAULT PRIVILEGES` per schema | `027_app_role.sql`; Java `common-security/.../rls/GRANTS_TEMPLATE.sql` + per-service `V0xx__grant_baalvion_app.sql` |
| `ENABLE` + `FORCE ROW LEVEL SECURITY` + fail-closed tenant policy | `@baalvion/tenancy` `enableRlsSql()`; per-service RLS migrations; Java `V007__force_rls.sql` |
| Per-request tenant GUC mechanism (`app.current_tenant`, `app.tenant_bypass`) | `@baalvion/tenancy` `tenantMiddleware()`, `withTenantTransaction()`, `withTenantClient()` |
| Platform-vs-tenant bypass model (only `platform_admin` / `platform_security_admin` bypass) | `@baalvion/tenancy` `roles.js` |
| Readiness audit | `Backend/scripts/tenant-isolation-audit.mjs` |

## Per-service cutover steps (repeat per bounded context; needs CODEOWNERS review)

1. **Confirm policies exist** for every tenant table in the service's schema:
   `node Backend/scripts/tenant-isolation-audit.mjs` — fix any table reported without RLS by adding
   a migration that calls `enableRlsSql(schema, table, { tenantColumn })`.
2. **Wire the GUC** — ensure the service mounts `tenantMiddleware()` after auth, and that **all**
   DB access runs inside `withTenantTransaction()` / `withTenantClient()` (GUCs are `SET LOCAL`, so
   they must be inside a transaction; a stray query outside one will see zero rows once cut over).
3. **Provision the role** (once per database) — apply `027_app_role.sql` + the Java grant
   migrations. Idempotent and role-guarded (safe to re-run).
4. **Switch the connection role** — set `DB_USER=baalvion_app` (+ its password) for the service.
   Keep running **migrations** as the owner / `POSTGRES_USER` (they must bypass RLS).
5. **Verify isolation** before promoting:
   - a tenant-A token cannot read tenant-B rows,
   - a `platform_admin` (bypass) can,
   - no tenant context ⇒ **zero rows**, inserts rejected.
6. **Load-test** the service on `baalvion_app` (the GUC `SET LOCAL` per transaction has a small
   per-request cost) before flipping production traffic.

## Production env (deploy packages)

Each `deploy/*/.env.prod.example` now documents the cutover and TLS:

```
# DB_USER=baalvion_app                 # uncomment once the service above is verified
# DB_PASSWORD=__CHANGE_ME__baalvion_app_password__
DB_SSL=true                            # REQUIRED when DB_HOST is RDS
DB_SSL_REJECT_UNAUTHORIZED=true
# DB_SSL_CA=<RDS CA bundle PEM>
```

## Rollback

Point `DB_USER` back at the owner role and restart — RLS goes dormant again (no schema change
needed). Because policies are fail-closed, the only failure mode of a bad cutover is "no rows /
inserts rejected", never a cross-tenant leak.
