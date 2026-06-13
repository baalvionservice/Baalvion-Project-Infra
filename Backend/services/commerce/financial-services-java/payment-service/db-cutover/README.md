# Shared-DB cutover — `payments` schema → Java payment-service

One-time operational step to run **before the first boot of the Java
`payment-service` against the shared `baalvion_db`**.

## Why this exists

The shared DB was previously populated by the **Node** payment-service (now
deleted in the finance consolidation). It left three orphaned tables in the
`payments` schema, created directly (no Flyway):

| table | origin | Java equivalent |
|---|---|---|
| `payments.transactions` | Node | created by Flyway `V001` (different shape) |
| `payments.gateway_payments` | Node | created by Flyway `V009`/`V010` (different shape) |
| `payments.payment_ledger_entries` | Node | **none** (Node-only) |

The Java payment-service **owns** the `payments` schema through Flyway
(`V001..V010`). On first boot it has no `flyway_history_payment` row, so it runs
every migration from V001 — and `CREATE TABLE payments.transactions` /
`payments.gateway_payments` **collide** with the Node tables (and with
constraint/index names like `gateway_payments_pkey`). Boot fails on
`relation already exists`.

## What the cutover does

[`cutover_payments_node_to_java.sql`](./cutover_payments_node_to_java.sql)
**archives** each pre-Java table into a separate `payments_legacy` schema via
`ALTER TABLE ... SET SCHEMA` — moving the whole table with its indexes,
constraints, and sequences out of the `payments` namespace. Then Java Flyway
builds the canonical schema cleanly.

- **Reversible** — data is moved, never dropped.
- **Idempotent / self-guarded** — no-op once `flyway_history_payment` exists;
  a re-run never overwrites an existing archive.
- Ensures the `postgres` role exists (V001 assigns schema ownership to it).

## Prerequisites

- A DB **superuser/owner** connection (default platform user `baalvion`).
- **Take a snapshot / `pg_dump` first** if this DB holds anything you care about.
- The `baalvion_app` runtime role should be provisioned (platform migration
  `027_app_role`) for full RLS grants. If absent, the grant migrations
  (`V008`/`V009`/`V010`) are role-guarded and simply skip — re-run them by
  re-applying after provisioning, or provision the role first.

## Run it

```bash
# Against the shared Postgres container (adjust names/creds to your env):
docker exec -e PGPASSWORD=baalvion_dev_pass -i baalvion-postgres \
  psql -U baalvion -d baalvion_db \
  < Backend/services/commerce/financial-services-java/payment-service/db-cutover/cutover_payments_node_to_java.sql

# Or via a psql client:
psql "postgresql://baalvion:***@localhost:5432/baalvion_db" \
  -f Backend/services/commerce/financial-services-java/payment-service/db-cutover/cutover_payments_node_to_java.sql
```

Watch the `NOTICE` lines — each archived table is logged.

## Verify

```sql
-- payments should no longer hold the Node tables (only flyway_history_payment
-- once Java has booted):
\dt payments.*
-- the archived data is preserved here:
\dt payments_legacy.*
SELECT count(*) FROM payments_legacy.gateway_payments;        -- was 23
SELECT count(*) FROM payments_legacy.payment_ledger_entries;  -- was 26
```

Then boot the Java payment-service and confirm Flyway applied `V001..V010`:

```
... DbMigrate - Successfully applied N migrations ... now at version v010
... Started PaymentServiceApplication ...
```

## Rollback

- **Before** Java boots: move a table back with
  `ALTER TABLE payments_legacy.<t> SET SCHEMA payments;`
- **After** Java boots: the `payments_legacy.*` tables are a pure archive. Once
  the Java schema is verified and any needed data migrated, drop them:
  `DROP TABLE payments_legacy.<t>;` (or `DROP SCHEMA payments_legacy CASCADE;`).

## Notes

- `payments.payment_ledger_entries` has **no** Java equivalent. It is retained
  in `payments_legacy` for audit; migrate any needed rows into the Java ledger
  (`financial-services-java/ledger-service`) before dropping.
- `audit.events` and other schemas are untouched — this cutover only affects
  `payments`.
- Fresh databases (no `payments` schema) don't need this script; Java Flyway
  creates the schema from scratch. The script detects that and no-ops.
