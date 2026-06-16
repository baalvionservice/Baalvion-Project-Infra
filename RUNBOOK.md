# Baalvion — Operations Runbook (Limited Beta)

Day-2 operations for the booted commerce vertical. Pairs with `DEPLOYMENT_GUIDE.md`
(stand-up), `docs/runbooks/disaster-recovery.md` (backup/restore), and
`docs/runbooks/commerce-launch-operations.md` (reconciliation/ledger/media detail).

---

## 1. Start / stop / status

```bash
# bring the beta vertical up (idempotent)
./bootstrap.sh                  # or .\bootstrap.ps1

# day-to-day (no migrate/seed)
docker compose up -d postgres redis rbac-service order-service cms-service payment-service
docker compose ps
docker compose logs -f order-service          # tail one service
docker compose stop order-service             # stop one
docker compose down                           # stop all (KEEPS volumes/data)
docker compose down -v                         # stop all + DELETE data (use only intentionally)
```

## 2. Health

```bash
curl -s localhost:3055/health            # rbac
curl -s localhost:3013/health            # order
curl -s localhost:3019/health            # payment
curl -s localhost:3011/api/v1/health     # cms (note the /api/v1 path)
```
A service that is up but failing `/health` is usually a DB/Redis connectivity issue —
check `docker compose logs <svc>` and that `baalvion-postgres` is `healthy`.

## 3. Regression check (after any change)

```bash
node warroom/revenue_e2e.cjs --refund
node warroom/enforcement_e2e.cjs
node warroom/security_e2e.cjs
node warroom/payment_e2e.cjs       # leave INTERNAL_SERVICE_SECRET unset locally
```
All four should print `PASS ✅` / end with `DONE`.

---

## 4. Incident playbook

### A service won't start
1. `docker compose logs <svc> --tail=100`.
2. Postgres healthy? `docker inspect --format='{{.State.Health.Status}}' baalvion-postgres`.
3. Missing env? `node Backend/scripts/check-env.cjs`.
4. Schema missing on a fresh volume? Re-run `./bootstrap.sh` (idempotent).
5. **Java finance service refused at DB connect** (logs show SSL/`pg_hba`/connection-refused):
   the DB enforces TLS but `DB_JDBC_PARAMS` is empty. Set `DB_JDBC_PARAMS=?sslmode=require`
   (these are fail-closed; see DEPLOYMENT_GUIDE §5.1).

### Uploads returning 503
- `@baalvion/upload` fails **closed** in production: `UPLOAD_SCAN_REQUIRED` defaults `true`
  and no `UPLOAD_SCAN_URL` is wired → cms / commerce / law reject every upload with 503.
  Wire a scanner (`UPLOAD_SCAN_URL`) or set `UPLOAD_SCAN_REQUIRED=false` to opt out.

### Payments failing
- `401` on create-intent from a client: internal-auth secret mismatch. payment-service uses
  `INTERNAL_SERVICE_SECRET` or the dev default; callers must match.
- `422 NO_PAYMENT_PROVIDER`: the website's CMS vault has no enabled+configured provider →
  run `configurePaymentSites.cjs` (mock) or `configureSandboxPayments.cjs` (sandbox).
- Webhook `401`: signature/secret mismatch — the vault `webhookSecret` must equal the
  provider's configured signing secret. Tampered/old events are *supposed* to 401.
- Stuck `refund_pending` ledger row: a crash between claim and provider call — the
  reconciliation sweep resolves it; never reissue a refund manually.

### Authorization surprises (403)
- RBAC fails **closed** by default (`RBAC_FAIL_MODE=closed`). If rbac-service is down,
  resource services deny. Bring rbac up first.
- A user lacking a store role gets `403` on store admin endpoints — assign a role (see §5).

### Revoked token still working / not working
- Revocation = a `auth:blacklist:<jti>` key in Redis. order-service checks it fail-closed.
  `docker exec baalvion-redis redis-cli KEYS 'auth:blacklist:*'`.

### Ledger drift
- See `docs/runbooks/commerce-launch-operations.md` (reconciliation report + backfill).
  Posting is fail-open, so drift is expected during a ledger outage and self-heals on backfill.

---

## 5. Common admin tasks

```bash
# mint an admin (super_admin) token for API calls / scripts
node Backend/scripts/mint-token.cjs --sub 9000077 --roles super_admin

# assign a store-team role (ops_manager | store_viewer | product_manager | seo_manager | store_admin)
docker exec -e PGPASSWORD=baalvion_dev_pass baalvion-postgres psql -U baalvion -d baalvion_db -c \
 "INSERT INTO rbac.role_assignments (user_id,role_id,tenant_id,scope_type,scope_id,status,created_at,updated_at)
  SELECT '<USER_ID>', r.id, t.id, 'organization', '<STORE_ID>', 'active', now(), now()
  FROM rbac.roles r, rbac.tenants t WHERE r.key='ops_manager' AND t.type='platform';"

# re-seed / re-provision (idempotent)
DB_HOST=localhost pnpm --filter commerce-service exec node scripts/seedAmarise.js
```

## 6. Backup & restore

```bash
pwsh -File scripts/db-backup.ps1                                   # nightly backup
pwsh -File scripts/db-restore.ps1                                  # safe rehearsal
pwsh -File scripts/db-verify-restore.ps1                           # row-for-row verify
# real recovery over the live DB: see docs/runbooks/disaster-recovery.md §3B
```

## 7. Secret rotation

1. Generate the new value; update `.env` and any provider/vault entry.
2. `docker compose up -d <affected services>` to pick up env changes.
3. Rotating the RS256 keypair invalidates all live tokens — coordinate (or keep the old
   public key in the verifier set during overlap).
