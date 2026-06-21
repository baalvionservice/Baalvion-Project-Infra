#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-time DB init for the CORE 3-service stack.
# Run ONCE, from the REPO ROOT, AFTER `docker compose ... up -d --build` is healthy.
# Automates the validated sequence:
#   wait healthy → auth migrations → cms migrations → super-admin → (optional) register the
#   payment website tenant (CMS-vault mode) → print credentials.
#
# payment-service migrates ITSELF on boot (Flyway, flyway_history_payment) — nothing to do here.
#
#   bash deploy/core-stack/init-data.sh
#
# The schema migrations are NOT idempotent — only run this on a FRESH database. The super-admin
# bootstrap + website register ARE idempotent.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENVFILE="${CORE_ENV_FILE:-deploy/core-stack/.env.prod}"
COMPOSE="deploy/core-stack/docker-compose.prod.yml"
CF="--env-file $ENVFILE -f $COMPOSE"
AUTH_MIG="Backend/services/identity/auth-service/migrations"

# Set REGISTER_PAYMENT_SITE=<slug> to register a website tenant for per-tenant CMS-vault keys
# (then enter that site's Razorpay keys in the admin console, and call payments with ?site=<slug>).
# Leave unset for GLOBAL env-key (single-tenant) mode.
REGISTER_PAYMENT_SITE="${REGISTER_PAYMENT_SITE:-}"

[ -f "$ENVFILE" ] || { echo "ERROR: $ENVFILE not found. Copy .env.prod.example → .env.prod and fill it."; exit 1; }

# Load only the scalar vars (the multi-line PEM keys break `source`).
export $(grep -E '^(POSTGRES_USER|POSTGRES_DB|SUPERADMIN_EMAIL|SUPERADMIN_PASSWORD)=' "$ENVFILE" | xargs)

psql_q() { docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"; }

echo "[1/5] Waiting for postgres + auth-service + cms-service to be healthy..."
for i in $(seq 1 40); do
  pg=$(docker compose $CF ps postgres --format '{{.Health}}' 2>/dev/null || echo "")
  au=$(docker compose $CF ps auth-service --format '{{.Health}}' 2>/dev/null || echo "")
  cm=$(docker compose $CF ps cms-service --format '{{.Health}}' 2>/dev/null || echo "")
  echo "    postgres=$pg auth-service=$au cms-service=$cm"
  [ "$pg" = "healthy" ] && [ "$au" = "healthy" ] && [ "$cm" = "healthy" ] && break
  sleep 5
  [ "$i" = "40" ] && { echo "ERROR: services not healthy after ~200s. Check: docker compose $CF logs"; exit 1; }
done

echo "[2/5] Applying auth schema migrations (001-008, then 009 RLS best-effort)..."
for f in "$AUTH_MIG"/00{1,2,3,4,5,6,7,8}*.sql; do
  [ -e "$f" ] || continue
  echo "    >> $(basename "$f")"
  psql_q -v ON_ERROR_STOP=1 -q < "$f" >/dev/null
done
psql_q -q < "$AUTH_MIG"/009*.sql >/dev/null 2>&1 && echo "    >> 009 (RLS)" || echo "    (009 skipped — ok)"

echo "[3/5] Applying CMS schema migrations..."
docker compose $CF --profile tools run --rm cms-migrate

echo "[4/5] Bootstrapping super-admin..."
BOOT=$(docker compose $CF exec -T \
  -e SUPERADMIN_EMAIL="$SUPERADMIN_EMAIL" -e SUPERADMIN_PASSWORD="$SUPERADMIN_PASSWORD" \
  auth-service node scripts/bootstrapSuperAdmin.js)
echo "$BOOT"
ORG_ID=$(printf '%s' "$BOOT" | grep -oE '"orgId":[[:space:]]*"[^"]+"' | head -n1 | cut -d'"' -f4) || true
USER_ID=$(printf '%s' "$BOOT" | grep -oE '"userId":[[:space:]]*"[^"]+"' | head -n1 | cut -d'"' -f4) || true
[ -n "$ORG_ID" ] && [ -n "$USER_ID" ] || { echo "ERROR: could not parse orgId/userId from bootstrap output"; exit 1; }
echo "    orgId=$ORG_ID userId=$USER_ID"

echo "[5/5] Payment website tenant (CMS-vault mode)..."
if [ -n "$REGISTER_PAYMENT_SITE" ]; then
  echo "    Registering site '$REGISTER_PAYMENT_SITE' (owned by the super-admin org)..."
  docker compose $CF --profile tools run --rm \
    -e CMS_ORG_ID="$ORG_ID" -e CMS_CREATED_BY="$USER_ID" \
    -e CMS_WEBSITE_SLUG="$REGISTER_PAYMENT_SITE" cms-register
  echo "    Done. Next: enter this site's Razorpay keys in the admin console vault, then call"
  echo "    payments with ?site=$REGISTER_PAYMENT_SITE."
else
  echo "    Skipped (GLOBAL env-key mode). Set RAZORPAY_KEY_ID/SECRET in .env.prod and call"
  echo "    payments WITHOUT ?site=, OR re-run with REGISTER_PAYMENT_SITE=<slug> for vault mode."
fi

echo ""
echo "DONE. Login: $SUPERADMIN_EMAIL"
echo "Endpoints (via Caddy):"
echo "  auth     https://\${DOMAIN_API}/v1/auth/login   (JWKS: /.well-known/jwks.json)"
echo "  cms      https://\${DOMAIN_CMS}/api/v1/public/<slug>/content"
echo "  payment  POST https://\${DOMAIN_API}/v1/gateway/payments   webhook: /v1/gateway/webhooks/razorpay"
