#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-time DB init + catalog/content seed for the Amarisé Maison Avenue stack.
# Run ONCE, from the REPO ROOT, AFTER `docker compose ... up -d --build` is healthy.
# Sequence (validated to mirror the local stack):
#   wait healthy → auth migrations → cms/commerce/inventory/order migrations →
#   super-admin bootstrap → seed product catalog → seed+publish CMS content → verify
#
#   bash deploy/amarise-maison-avenue/init-data.sh
#
# Re-runnable parts (product seed = wipe+reseed, cms seed = idempotent) are safe to repeat;
# the SQL/sequelize schema migrations are NOT — only run this on a FRESH database.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENVFILE="${AMARISE_ENV_FILE:-deploy/amarise-maison-avenue/.env.prod}"
COMPOSE="deploy/amarise-maison-avenue/docker-compose.prod.yml"
CF="--env-file $ENVFILE -f $COMPOSE"
AUTH_MIG="Backend/services/identity/auth-service/migrations"

[ -f "$ENVFILE" ] || { echo "ERROR: $ENVFILE not found. Copy .env.prod.example → .env.prod and fill it."; exit 1; }

# Load only scalar vars (multi-line PEM keys break `source`).
export $(grep -E '^(POSTGRES_USER|POSTGRES_DB|SUPERADMIN_EMAIL|SUPERADMIN_PASSWORD)=' "$ENVFILE" | xargs)

psql_q()  { docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"; }
seed_run(){ docker compose $CF --profile tools run --rm "$@"; }
health()  { docker compose $CF ps "$1" --format '{{.Health}}' 2>/dev/null || echo ""; }

echo "[1/7] Waiting for postgres + auth + cms + commerce + order to be healthy..."
for i in $(seq 1 48); do
  pg=$(health postgres); au=$(health auth-service); cm=$(health cms-service)
  co=$(health commerce-service); od=$(health order-service)
  echo "    postgres=$pg auth=$au cms=$cm commerce=$co order=$od"
  [ "$pg" = healthy ] && [ "$au" = healthy ] && [ "$cm" = healthy ] && [ "$co" = healthy ] && [ "$od" = healthy ] && break
  sleep 5
  [ "$i" = 48 ] && { echo "ERROR: services not healthy after ~240s. Check: docker compose $CF logs"; exit 1; }
done

echo "[2/7] Applying auth schema migrations (001-008a, 010 phone, 011 oauth; RLS 009 last)..."
# Order mirrors auth-service `npm run migrate`: base schema → 010 (phone OTP) →
# 011 (Google/Facebook social-login columns) → 009 (RLS) last. The 00{1..8} glob alone
# silently skipped 010/011, so social login had no oauth_provider columns to write to.
for f in "$AUTH_MIG"/00{1,2,3,4,5,6,7,8}*.sql "$AUTH_MIG"/010_*.sql "$AUTH_MIG"/011_*.sql; do
  echo "    >> $(basename "$f")"
  psql_q -v ON_ERROR_STOP=1 -q < "$f" >/dev/null
done
echo "    >> 009 (RLS, best-effort)"
psql_q -q < "$AUTH_MIG"/009*.sql >/dev/null 2>&1 || echo "    (009 skipped — ok)"

echo "[3/7] Applying CMS + commerce + inventory + order schema migrations..."
docker compose $CF --profile tools run --rm cms-migrate
docker compose $CF --profile tools run --rm commerce-migrate
docker compose $CF --profile tools run --rm inventory-migrate
docker compose $CF --profile tools run --rm order-migrate

echo "[4/7] Bootstrapping super-admin..."
BOOT=$(docker compose $CF exec -T \
  -e SUPERADMIN_EMAIL="$SUPERADMIN_EMAIL" -e SUPERADMIN_PASSWORD="$SUPERADMIN_PASSWORD" \
  auth-service node scripts/bootstrapSuperAdmin.js)
echo "$BOOT"
ORG_ID=$(printf '%s' "$BOOT" | grep -oE '"orgId":[[:space:]]*"[^"]+"' | head -n1 | cut -d'"' -f4) || true
USER_ID=$(printf '%s' "$BOOT" | grep -oE '"userId":[[:space:]]*"[^"]+"' | head -n1 | cut -d'"' -f4) || true
[ -n "$ORG_ID" ] && [ -n "$USER_ID" ] || { echo "ERROR: could not parse orgId/userId from bootstrap"; exit 1; }
echo "    orgId=$ORG_ID userId=$USER_ID"

echo "[5/7] Seeding the Amarisé product catalog (store + brands + categories + products)..."
seed_run -e AMARISE_ORG_ID="$ORG_ID" -e AMARISE_OWNER_ID="$USER_ID" commerce-seed

echo "[6/7] Seeding + publishing CMS content (homepage, press, about, customer-service, membership)..."
docker compose $CF --profile tools run --rm cms-seed

echo ""
echo "[7/7] Verify..."
CMS_N=$(docker compose $CF exec -T cms-service node -e \
  "fetch('http://localhost:3011/api/v1/public/amarise-maison-avenue/content?limit=200').then(r=>r.json()).then(j=>console.log((j.data||[]).length)).catch(()=>console.log('ERR'))" 2>/dev/null | tr -d '[:space:]')
PROD_N=$(psql_q -tAc "select count(*) from commerce.commerce_products where status='published'" 2>/dev/null | tr -d '[:space:]' || echo "?")
echo "    CMS published items: ${CMS_N:-?}"
echo "    Commerce published products: ${PROD_N:-?}"

echo ""
echo "DONE. Both counts should be non-zero."
echo "Next:"
echo "  • Visit https://${DOMAIN:-amarisemaisonavenue.com} — storefront + catalog should be live."
echo "  • Add real product photos + edit the homepage in the admin (see GO-LIVE.md)."
echo "  • Drop in payment keys + set PAYMENTS_MOCK=false to switch on real checkout (GO-LIVE.md)."
