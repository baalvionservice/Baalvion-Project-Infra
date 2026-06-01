# Disaster Recovery Runbook (Priority 3)

Backup, restore, and **proven** row-for-row recovery for the shared `baalvion_db`
(all per-service schemas). Every command runs through `docker exec` against the running
`baalvion-postgres` container — no host `psql`/`pg_dump` needed.

> **Drill result (2026-06-02, live):** backup → restore → verify → **destroy** →
> re-restore → re-verify, all green. Evidence in §4.

---

## 1. Tooling

| Script | Purpose |
|---|---|
| `scripts/db-backup.ps1` | Point-in-time backup: `.dump` (custom `-Fc`) + `.sql.gz` (portable) + `.sha256` + `.manifest.json` (per-table row counts). 14-day retention prune. |
| `scripts/db-restore.ps1` | Restore a `.dump` into a target DB. Default target `baalvion_restore_test` (safe). Verifies the SHA-256 before restoring. |
| `scripts/db-verify-restore.ps1` | **Proves** a restore matches the backup **row-for-row** vs the manifest's point-in-time counts (bidirectional: fails on any missing/extra table or count mismatch; tolerates ±5 skew only on volatile telemetry tables). |

Artifacts land in `backups/`. The manifest's row counts are the **point-in-time truth**
the verifier compares against (never the moving live DB).

---

## 2. Routine backup

```powershell
pwsh -File scripts/db-backup.ps1
# -> backups/<ts>_baalvion_db.{dump,sql.gz,sha256,manifest.json}
```
Schedule daily (Task Scheduler / cron). Ship `backups/` off-box (S3/MinIO) for real DR;
the local copy only survives a logical loss, not a host loss.

---

## 3. Recovery procedure

### A. Safe rehearsal (no impact — restores into a throwaway DB)
```powershell
pwsh -File scripts/db-restore.ps1                 # -> baalvion_restore_test
pwsh -File scripts/db-verify-restore.ps1          # row-for-row PASS
```

### B. Real recovery (restore over the live DB — DESTRUCTIVE, requires the explicit flag)
```powershell
# 1. Stop the app tier so nothing writes mid-restore
docker compose stop order-service rbac-service payment-service cms-service commerce-service inventory-service
# 2. Restore the chosen dump over baalvion_db (drops + recreates it)
pwsh -File scripts/db-restore.ps1 -TargetDb baalvion_db -IUnderstandThisDropsData
# 3. Verify against the dump's manifest
pwsh -File scripts/db-verify-restore.ps1 -TargetDb baalvion_db
# 4. Restart the app tier
docker compose up -d order-service rbac-service payment-service cms-service
# 5. Re-run the regression harnesses (see LIMITED_BETA_SIGNOFF.md)
```
Pick a specific dump with `-DumpFile backups/<ts>_baalvion_db.dump` (default = newest).

---

## 4. Verified drill evidence (2026-06-02)

```
backup    : 20260602_035110_baalvion_db.dump (1997.6 KB) + manifest (540 tables)
restore   : checksum OK -> baalvion_restore_test
verify    : PASS — all 540 tables match the backup point-in-time (9686 rows)
integrity : orders=13 (paid=3, refunded=6) · test customer present · rbac roles=10/assignments=3/tenants=3
            auth.users=87 (+ sessions, refresh_tokens, password_resets, oauth_* tables) · payments 19 gateway / 18 ledger
            25 FK constraints restored (schema, not data-only)
DISASTER  : DROP DATABASE baalvion_restore_test -> exists=false
re-restore: checksum OK -> baalvion_restore_test
re-verify : PASS — all 540 tables match (9686 rows)
```

This proves: backups are **complete** (every schema), **restorable**, **integrity-preserving**
(orders, authorization model, login/identity credentials, payment ledger, and foreign keys all
survive), and recovery is **repeatable** from the dump file after total loss of the database.

---

## 5. RPO / RTO (current posture)

- **RPO:** = backup interval (run `db-backup.ps1` on a schedule; daily by default). Tighten with
  WAL archiving / PITR for sub-minute RPO (not configured in Limited Beta).
- **RTO (observed):** restore + verify of this dataset completed in seconds. Scales with DB size.
- **Off-site:** required for true DR — copy `backups/` to durable remote storage.
