# Tenant Isolation (RLS) — Financial Services

Status as of this change. Tenant isolation in the financial tier is a **three-layer**
control, and **all three layers are now implemented AND verified** against a real
PostgreSQL. The keystone compiles (`mvn compile`, common-security + the 9 production
services), all RLS/FORCE/grant Flyway migrations apply in a real boot, and an
end-to-end Testcontainers integration test
(`risk-service/.../RlsTenantIsolationIntegrationTest`) proves isolation through the
full stack — JWT → AuthContext → aspect → `set_config` → RLS policy — with JPA
connecting as the non-superuser `baalvion_app` and Flyway as the owner.

What remains is purely **operational, per environment**: provision the `baalvion_app`
login credentials and set `DB_APP_USER`/`DB_APP_PASSWORD` (+ `DB_MIGRATION_USER` for
Flyway). The config split is already wired into every service's `application.yml` with
safe defaults (both default to `postgres`, so nothing changes until the env is set).

## The three layers — and why all three are required

| # | Layer | Where | Status |
|---|-------|-------|--------|
| 1 | `ENABLE ROW LEVEL SECURITY` + `tenant_isolation` policy on each tenant table | Flyway migrations | ✅ present (all 49 tenant tables) |
| 2 | `FORCE ROW LEVEL SECURITY` so the **table owner** is also subject to the policy | Flyway `V*__force_rls.sql` / `V*__rls.sql` | ✅ added |
| 3a | App connects as a **non-superuser** role (`baalvion_app`); Flyway as owner | `application.yml` env split + `V*__grant_baalvion_app.sql` | ✅ wired + grants migrations added; **enable per-env via `DB_APP_USER`** |
| 3b | Sets `app.current_tenant_id` per transaction | `RlsTenantSession` + `RlsTenantAspect` | ✅ implemented + **integration-test verified** |

**Verification evidence (run in a `maven:3.9-eclipse-temurin-17` container):**
- `mvn compile -pl common-security,risk-service,…` → BUILD SUCCESS.
- `RlsTenantIsolationIntegrationTest` → 3/3 pass: (a) each tenant sees only its own
  rows [proves the aspect sets the GUC *inside* the JPA transaction — the ordering is
  not left to chance], (b) unauthenticated context returns zero rows (fail-closed),
  (c) cross-tenant write rejected by `WITH CHECK`.
- A standalone SQL proof (`common-security/src/test/resources/rls/rls_isolation_proof.sql`)
  asserts the same contract directly against psql as `baalvion_app`.

> **Critical:** layers 1 and 2 are *inert on their own*. Postgres ignores RLS
> entirely for **superusers**, and (without FORCE) for the **table owner**. Today
> every service connects as `DB_USER:postgres` (a superuser) and nothing sets the
> tenant GUC — so the policies, including the FORCE just added, currently enforce
> **nothing**. Layer 3 is what switches isolation on. Until it lands, treat the
> financial tier as **not tenant-isolated at the database layer**.

The policies read the tenant from a session GUC:

```sql
-- e.g. risk-service V001
CREATE POLICY risk_assessments_tenant_isolation ON risk.risk_assessments
  USING      (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

Nothing sets `app.current_tenant_id`, so `current_setting(...)` errors / returns
empty and the policy would deny everything — which is masked today only because
the superuser connection bypasses RLS altogether.

## Layer 3 — IMPLEMENTED (pending `mvn verify` + integration test)

The identity half already existed: `AuthContext.currentTenantId()` returns the
tenant from the validated JWT, and `TenantContext.resolve()` is fail-closed. The
runtime mechanism that pushes that tenant into the DB session per transaction is
now implemented in `common-security`:

- **`common-security/.../RlsTenantSession.java`** — runs
  `SELECT set_config('app.current_tenant_id', :t, true)` on the current
  transaction's connection, where `:t` = `AuthContext.currentTenantId().orElse(TenantContext.SYSTEM_TENANT)`.
  It hard-checks `TransactionSynchronizationManager.isActualTransactionActive()`
  and **no-ops when there is no active transaction / no `EntityManager`**, so it can
  never set the GUC on the wrong (or a throwaway) connection.
- **`common-security/.../RlsTenantAspect.java`** — an `@Order(LOWEST_PRECEDENCE)`
  aspect on `@Transactional` that invokes `RlsTenantSession` from inside the
  transactional boundary. **Ordering-immune by design:** because the session method
  hard-checks for an active transaction, a mis-ordered aspect degrades to a no-op
  (fail-closed: the RLS policy then denies the query) rather than leaking another
  tenant's connection.
- Both are registered as beans in `BaalvionSecurityAutoConfiguration`, gated by
  **`app.security.rls.enabled`** (default `true`, `matchIfMissing=true`) and
  `@ConditionalOnClass(EntityManager.class)` so non-JPA services are unaffected.
- **`common-security/src/main/resources/rls/GRANTS_TEMPLATE.sql`** — the per-schema
  GRANT template each service must instantiate for `baalvion_app` (run as the owner).

### Why the mechanism avoids the `@Transactional` ordering footgun
A naive aspect that sets the GUC can fire before Spring's transaction interceptor
binds a connection, setting the GUC on the wrong/closed connection. Here the GUC is
applied through `RlsTenantSession`, which only acts when `isActualTransactionActive()`
is true. So correctness does **not** depend on advisor ordering: worst case it does
nothing and RLS fails closed.

### 3a. Connect as a non-superuser role

Change the datasource user from the superuser `postgres` to the platform app role
`baalvion_app` (the cluster-wide role established by the Node tenancy rollout).
It needs `USAGE` on each schema and `SELECT/INSERT/UPDATE/DELETE` on the tenant
tables (RLS is checked *after* table privileges, so the grants must exist). The
reusable template is
**`common-security/src/main/resources/rls/GRANTS_TEMPLATE.sql`** — copy it into a
Flyway migration in **each service**, replacing the `<schema>` placeholder, and run
it as the owner. Example (risk-service):

```sql
GRANT USAGE ON SCHEMA risk TO baalvion_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA risk TO baalvion_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA risk TO baalvion_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA risk GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO baalvion_app;
```

Flyway migrations must keep running as the **owner/superuser** (DDL + RLS bypass),
so override the Flyway user separately from the runtime user:

```yaml
spring:
  datasource:
    username: ${DB_USER:baalvion_app}          # runtime: RLS applies
    password: ${DB_PASSWORD}
  flyway:
    user: ${DB_MIGRATION_USER:postgres}        # migrations: owner, bypasses RLS
    password: ${DB_MIGRATION_PASSWORD:${DB_PASSWORD}}
```

### 3b. Set the tenant GUC on every transaction

Set it with `set_config('app.current_tenant_id', <uuid>, true)` — the `true`
makes it **transaction-local** (`SET LOCAL`), so it is automatically cleared at
commit/rollback and **cannot leak across pooled connections**. Bind the value as a
parameter (`SET LOCAL app.x = $1` is a syntax error in Postgres; `set_config` takes
a parameter).

This is **implemented** (`RlsTenantSession` + `RlsTenantAspect`, gated by
`app.security.rls.enabled`, default on). `spring-boot-starter-aop`,
`jakarta.persistence-api`, and `spring-tx` were added to `common-security/pom.xml`
(all `optional`) so the classes compile; on a service the AOP + JPA come in via
`spring-boot-starter-data-jpa`.

> ## ⚠️ VERIFICATION REQUIRED — do NOT trust in production until all of this passes
>
> The author environment had only Java 1.7 and no Maven, so **none of the Java below
> was compiled or run.** Before this is live:
>
> 1. **`mvn -pl common-security verify`** (and a full reactor build) — confirm the new
>    classes compile and the optional `spring-boot-starter-aop` / `jakarta.persistence-api`
>    / `spring-tx` resolve. Confirm AspectJ pointcut syntax is accepted at startup.
> 2. **Testcontainers Postgres integration test** (place in a JPA-backed service such as
>    `risk-service`, connecting as `baalvion_app`, with `FORCE ROW LEVEL SECURITY`):
>    - tenant A's transaction (GUC = A) returns **only** tenant-A rows;
>    - a transaction with **no** GUC set returns **zero** rows (fail-closed) and/or errors
>      on `current_setting(...)::uuid` — confirm the desired fail-closed behaviour;
>    - a cross-tenant INSERT/UPDATE (row tenant ≠ GUC) is **rejected by `WITH CHECK`**.
> 3. **3a user split must actually be applied**: instantiate `GRANTS_TEMPLATE.sql` per
>    schema, and point the runtime datasource at `baalvion_app` (Flyway stays as owner).
>    Until then layer 3 is INERT — verify with a probe that a superuser connection still
>    bypasses RLS so you can prove the switch flipped.
> 4. **API review flags for the human reviewer:**
>    - `@PersistenceContext` injection on a non-`@Component`-managed plain bean: confirm
>      the container weaves the transaction-aware EM proxy (it does for Spring-managed
>      beans; `RlsTenantSession` is registered as a `@Bean`). If the proxy is not woven,
>      switch to constructor-injecting `EntityManagerFactory` + `EntityManagerFactoryUtils.getTransactionalEntityManager(...)`.
>    - The `set_config` native query returns a single `text` value; `getSingleResult()` is
>      correct for a `SELECT`. Confirm Hibernate does not complain about a `SELECT` issued
>      outside a query-cache/flush context.
>    - Aspect ordering vs. Spring's transaction advisor: `LOWEST_PRECEDENCE` is intended to
>      run inner, but confirm the transaction is bound when the advice fires (the code is
>      safe either way — verify it actually sets the GUC, not just no-ops).

## Remaining backlog — services with NO RLS at all

The FORCE change covered the services that already had policies. These services
have tenant tables with **no RLS whatsoever** (no ENABLE, no FORCE, no policy) and
need full layer-1 + layer-2 treatment before they hold tenant data on the live path:

`aml-service, credit-service, deal-room-service, dispute-service, fx-service,
payment-rails-service, smart-contract-service, trade-finance-service,
trade-intelligence-service, trust-score-service, wallet-service`

(They are currently unwired from the live request path; the live money path runs
through the Node `order-execution-service`.)

## How to track this

Run the platform auditor — it fails CI on any tenant table missing ENABLE / FORCE /
policy:

```sh
node Backend/scripts/tenant-isolation-audit.mjs Backend/services/commerce/financial-services-java
```

After this change, the **FORCE** findings are gone for the policy-bearing services;
the remaining findings are the no-RLS-at-all backlog above. The auditor checks the
**SQL** layer only — it cannot see the superuser-connection / missing-GUC problem,
so treat layer 3 as a separate, manual sign-off item until 3a + 3b are merged and
integration-tested.
