# ctm-service — fail-closed Row-Level Security rollout

**Status: defense-in-depth follow-up (NOT blocking go-live).** The directly-exploitable cross-tenant
issues are already closed at the application layer (every money/identity write derives `company_id`
from the verified token — see the security-review commit). RLS adds a database backstop so a *future*
missed check can't leak across tenants. It is a deliberate, tested ops change — **do not** enable it
piecemeal, or every query will fail-closed and the service will appear empty/broken.

## Why this isn't a one-line toggle
`ctm-service` today connects as the schema **owner** and scopes tenancy in JavaScript. Postgres RLS
is bypassed for the owner/superuser unless `FORCE` is set, and even with `FORCE` the policy is
**fail-closed**: with no tenant GUC set, **zero rows** are visible and inserts are rejected. So three
things must land together:

1. **A non-superuser app role** (`baalvion_app`) that `ctm-service` connects as (`DB_USER`).
2. **Per-request tenant context** — set `app.current_tenant` (LOCAL to a transaction) from
   `req.auth.orgId` on every request, on the *same connection* as the query.
3. **Bypass paths** — the webhook (`POST /payments/webhook`, no user) and the public marketing reads
   (`optionalAuth`) have no tenant; they must run with `app.tenant_bypass='on'` under an
   out-of-band login role, or be served by queries that don't need RLS scoping.

Use `@baalvion/tenancy` (`enableRlsSql`, `SET_TENANT_SQL`, `runWithTenant`) — the platform's vetted
helpers — rather than hand-rolling.

## Tenant tables (direct `company_id`)
`user_profiles`, `teams`, `tasks`, `subscriptions`, `invoices`, `payments`, `notifications`,
`activities`, `task_templates`.

> Indirectly-scoped tables (`team_members` → team, `submissions`/`evaluations` → task→company) need a
> join-based policy or stay protected by their parent + the app-layer checks — handle in a second pass.

## 1. Migration SQL (per table — emitted by `enableRlsSql('ctm', '<table>', { tenantColumn: 'company_id' })`)
```sql
ALTER TABLE "ctm"."invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ctm"."invoices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "ctm"."invoices";
CREATE POLICY "tenant_isolation" ON "ctm"."invoices"
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app')
        OR (current_setting('app.current_tenant', true) IS NOT NULL
            AND current_setting('app.current_tenant', true) <> ''
            AND "company_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK (/* same predicate */);
```
Generate the full set:
```js
const { enableRlsSql } = require('@baalvion/tenancy');
for (const t of ['user_profiles','teams','tasks','subscriptions','invoices','payments','notifications','activities','task_templates'])
  console.log(enableRlsSql('ctm', t, { tenantColumn: 'company_id' }));
```

## 2. Provision the app role (once)
```sql
CREATE ROLE baalvion_app LOGIN PASSWORD '<from secret manager>';
GRANT USAGE ON SCHEMA ctm TO baalvion_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ctm TO baalvion_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA ctm GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO baalvion_app;
-- baalvion_app must NOT be superuser and NOT own the tables (FORCE handles owner; this is the runtime login).
```
Point `ctm-service` at it: `DB_USER=baalvion_app` (+ password).

## 3. Wire per-request tenant context (ctm-service)
Add middleware that, for authed requests, runs each request's DB work inside a transaction that first
sets the GUC, e.g. with `runWithTenant(sequelize, req.auth.orgId, async () => { ... })`, or bind
`SET_TENANT_SQL` (`set_config('app.current_tenant', $1, true)`) at the start of the request's
transaction. The webhook + public reads run with bypass (`'on'`) under a separate admin login role.
Gate the whole thing behind `CTM_RLS_ENABLED` so it ships off and flips on only after testing.

## 4. Test before enabling in prod
- Tenant A's token cannot read/write Tenant B's invoices/payments/subscriptions (expect 0 rows / reject).
- The Razorpay/Stripe webhook still activates subscriptions (bypass path works).
- Public candidate/marketing reads still render.
- A request with no tenant set returns nothing (fail-closed proven).

## Rollback
`disableRlsSql('ctm', '<table>')` → `DROP POLICY` + `NO FORCE` + `DISABLE ROW LEVEL SECURITY` per table.
