# Runbook — Backup, Restore & PITR

## What to back up
- **PostgreSQL `baalvion`** — the system of record (ledger, payments, accounts, escrow,
  settlement, reconciliation, audit, reporting, risk, outbox, approvals, webhooks). This is the
  only durable state that matters for correctness.
- Kafka is a transport, not a store of record (outbox/inbox make it reconstructable); back up
  topic configs, not data.
- Redis is a cache/limiter — not backed up.

## Managed (recommended)
On AWS RDS / Cloud SQL: enable automated backups + PITR (continuous WAL), retention ≥ 14 days,
multi-AZ. Snapshot before every release that ships a migration.

## Manual / self-managed
```
# logical backup (per-schema or whole DB)
pg_dump --format=custom --dbname="$DB_URL" --file="baalvion-$(date +%Y%m%dT%H%M%S).dump"

# physical/PITR: base backup + archived WAL (pgBackRest / wal-g)
pgbackrest --stanza=baalvion backup
```
Schedule base backups daily, WAL archiving continuously (RPO ≤ 5 min target, design §11.1).

## Restore
```
# managed: restore to a new instance at a timestamp, then repoint DB_HOST
# logical:
createdb baalvion_restore
pg_restore --dbname=baalvion_restore --clean --if-exists baalvion-<ts>.dump
```

## Restore validation (mandatory before cutover)
1. Flyway: each service's `flyway_history_<svc>` is intact and `flyway info` shows all migrations applied.
2. Ledger invariant spot-check: `SELECT COALESCE(SUM(amount),0) FROM ledger.journal_entries
   WHERE status='POSTED' AND debit_account_id=:a` vs credits for a few known accounts.
3. RLS policies present: `SELECT * FROM pg_policies WHERE schemaname IN
   ('ledger','payments','accounts','escrow','settlement','reconciliation','audit','risk','reporting');`
4. Bring up one read-only replica pointing at the restore; run a reconciliation run for a recent
   day and confirm zero unexpected `EXCEPTION`/`UNMATCHED`.
5. Only then repoint `DB_HOST` and roll the services.

## Migration safety
Forward-only. Destructive changes use expand/contract over two releases. Always snapshot
immediately before a migration-bearing release; if it fails, restore + redeploy the prior image.
