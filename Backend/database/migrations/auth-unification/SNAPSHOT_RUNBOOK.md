# Island Snapshot Runbook (rollback artifacts)

> ⚠️ This static analysis environment has **no `psql`/`pg_dump` and no reachable Postgres**
> (verified: `command -v pg_dump` → NO; connection probe failed). The commands below MUST be run
> in the DB-capable environment. Snapshot row counts and import dry-run output are produced THERE
> and pasted back — they are intentionally **not fabricated here**.

## LAW snapshot

```bash
# 1) Export law users (schema-only + data) — the rollback artifact.
pg_dump "$DATABASE_URL" \
  --schema-only=false --no-owner --no-privileges \
  --table='legal.users' \
  > Backend/database/migrations/auth-unification/law-users-snapshot.sql

# 2) Verify readable + capture row count (must match DB).
grep -c "INSERT INTO" Backend/database/migrations/auth-unification/law-users-snapshot.sql
psql "$DATABASE_URL" -tAc "SELECT count(*) FROM legal.users;"   # authoritative count

# 3) Rollback (restore) procedure — if migration must be reverted:
#    a) imported auth users are removable by provenance (non-destructive to native users):
psql "$DATABASE_URL" -c "DELETE FROM auth.team_members tm USING auth.users u
                         WHERE tm.user_id=u.id AND u.imported_from='law';"
psql "$DATABASE_URL" -c "DELETE FROM auth.organizations WHERE slug='law-elite-network'
                         AND NOT EXISTS (SELECT 1 FROM auth.team_members t WHERE t.org_id=organizations.id);"
psql "$DATABASE_URL" -c "DELETE FROM auth.users WHERE imported_from='law';"
#    b) law-service legal.users is never modified by the import, so the island itself is intact;
#       the snapshot above is a belt-and-suspenders restore source:
#       psql "$DATABASE_URL" < law-users-snapshot.sql   # only if legal.users was lost
```

## Verification checklist (fill in from the DB env)
- [ ] `law-users-snapshot.sql` created and non-empty
- [ ] snapshot INSERT count == `SELECT count(*) FROM legal.users`
- [ ] `000_add_password_reset_required.sql` applied (auth.users has the new columns)
- [ ] `import-island-users.mjs --island=law` dry-run reviewed (importable / rejected / forcedResets)
- [ ] rollback path tested on a scratch DB
