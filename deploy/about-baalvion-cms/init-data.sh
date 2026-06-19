#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-time DB init + content seed for the About-Baalvion CMS stack.
# Run ONCE, from the REPO ROOT, AFTER `docker compose ... up -d --build` is healthy.
# Automates the exact sequence validated end-to-end:
#   auth migrations → cms migrations → super-admin → register website → seed → verify
#
#   bash deploy/about-baalvion-cms/init-data.sh
#
# Re-runnable parts (register, seed) are idempotent; the schema migrations are NOT —
# only run this on a FRESH database.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENVFILE="deploy/about-baalvion-cms/.env.prod"
COMPOSE="deploy/about-baalvion-cms/docker-compose.prod.yml"
CF="--env-file $ENVFILE -f $COMPOSE"
AUTH_MIG="Backend/services/identity/auth-service/migrations"

[ -f "$ENVFILE" ] || { echo "ERROR: $ENVFILE not found. Copy .env.prod.example → .env.prod and fill it."; exit 1; }

# Load only the scalar vars (the multi-line PEM keys break `source`).
export $(grep -E '^(POSTGRES_USER|POSTGRES_DB|SUPERADMIN_EMAIL|SUPERADMIN_PASSWORD)=' "$ENVFILE" | xargs)

echo "[1/6] Waiting for postgres + auth-service + cms-service to be healthy..."
for i in $(seq 1 40); do
  pg=$(docker compose $CF ps postgres --format '{{.Health}}' 2>/dev/null || echo "")
  au=$(docker compose $CF ps auth-service --format '{{.Health}}' 2>/dev/null || echo "")
  cm=$(docker compose $CF ps cms-service --format '{{.Health}}' 2>/dev/null || echo "")
  echo "    postgres=$pg auth-service=$au cms-service=$cm"
  [ "$pg" = "healthy" ] && [ "$au" = "healthy" ] && [ "$cm" = "healthy" ] && break
  sleep 5
  [ "$i" = "40" ] && { echo "ERROR: services not healthy after ~200s. Check: docker compose $CF logs"; exit 1; }
done

echo "[2/6] Applying auth schema migrations (001-009)..."
for f in "$AUTH_MIG"/00{1,2,3,4,5,6,7,8}*.sql; do
  echo "    >> $(basename "$f")"
  docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q < "$f" >/dev/null
done
echo "    >> 009 (RLS, best-effort)"
docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q < "$AUTH_MIG"/009*.sql >/dev/null 2>&1 || echo "    (009 skipped — ok)"

echo "[3/6] Applying CMS schema migrations..."
docker compose $CF --profile tools run --rm cms-migrate

echo "[4/6] Bootstrapping super-admin..."
BOOT=$(docker compose $CF exec -T \
  -e SUPERADMIN_EMAIL="$SUPERADMIN_EMAIL" -e SUPERADMIN_PASSWORD="$SUPERADMIN_PASSWORD" \
  auth-service node scripts/bootstrapSuperAdmin.js)
echo "$BOOT"
ORG_ID=$(echo "$BOOT" | grep -oE '"orgId":"[^"]+"' | head -1 | cut -d'"' -f4)
USER_ID=$(echo "$BOOT" | grep -oE '"userId":"[^"]+"' | head -1 | cut -d'"' -f4)
[ -n "$ORG_ID" ] && [ -n "$USER_ID" ] || { echo "ERROR: could not parse orgId/userId from bootstrap output"; exit 1; }
echo "    orgId=$ORG_ID userId=$USER_ID"

echo "[5/6] Registering about-baalvion website + resolving its id..."
docker compose $CF --profile tools run --rm \
  -e CMS_ORG_ID="$ORG_ID" -e CMS_CREATED_BY="$USER_ID" cms-register
WID=$(docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -tAc "select id from cms.cms_websites where slug='about-baalvion'" | tr -d '[:space:]')
[ -n "$WID" ] || { echo "ERROR: about-baalvion website not found after register"; exit 1; }
echo "    website id=$WID"

echo "[6/6] Seeding + publishing About-Baalvion content..."
docker compose $CF --profile tools run --rm -e ABOUT_WEBSITE_ID="$WID" cms-seed

echo ""
echo "=== Verify (public delivery API the frontend reads) ==="
docker compose $CF exec -T cms-service wget -qO- \
  "http://localhost:3011/api/v1/public/about-baalvion/content/home" | head -c 240
echo ""
echo ""
echo "DONE. If the line above shows {\"success\":true,...\"slug\":\"home\"...}, the CMS is serving content."
echo "Next: set CMS_PUBLIC_URL=https://<your-cms-domain>/api/v1/public in Vercel and redeploy."
