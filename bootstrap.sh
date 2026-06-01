#!/usr/bin/env bash
# =============================================================================
#  Baalvion — Zero-to-Beta Bootstrap (Limited-Beta commerce vertical)
# -----------------------------------------------------------------------------
#  Takes a fresh checkout to a working beta environment with ONE command:
#
#      git clone <repo> && cd <repo>
#      ./bootstrap.sh                 # idempotent: safe to re-run any time
#      ./bootstrap.sh --fresh         # WIPES the Postgres/Redis volumes first
#
#  Stages: preflight -> infra -> migrate -> services -> seed/provision ->
#          fixtures -> health-verify. Every stage is idempotent.
#
#  Prerequisites (a "fresh machine" must have these — they are standard for this
#  pnpm + Docker monorepo): Docker (+ compose v2), Node 20, pnpm (corepack).
#  The Sequelize services (commerce/order/inventory/cms) migrate via sequelize-cli
#  which lives in devDependencies, so migrations run host-side via pnpm.
#
#  Scope = the VERIFIED Limited-Beta vertical only:
#      postgres, redis, rbac-service, order-service, cms-service, payment-service
#      (+ commerce-service & inventory-service, best-effort for storefront/stock).
#  ledger-service is intentionally excluded (ledger posting is fail-open; its
#  Dockerfile is not monorepo-aware — see DEPLOYMENT_GUIDE.md / RELEASE_NOTES.md).
# =============================================================================
set -uo pipefail

# ── config ───────────────────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PG_CONTAINER="baalvion-postgres"
REDIS_CONTAINER="baalvion-redis"
DB_NAME="baalvion_db"; DB_USER="baalvion"; DB_PASS="baalvion_dev_pass"
STORE_ID="a0a00000-0000-4000-8000-000000000001"
CUSTOMER_ID="c0000000-0000-4000-8000-000000000001"
BUYER_UID="9000001"; OPS_UID="9000099"; VIEWER_UID="9000088"; ADMIN_UID="9000077"
BETA_SERVICES=(cms-service rbac-service order-service payment-service)
EXTRA_SERVICES=(commerce-service inventory-service)   # best-effort
FRESH=0; SKIP_INSTALL=0
for a in "$@"; do
  case "$a" in
    --fresh) FRESH=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
  esac
done

# ── ui helpers ─────────────────────────────────────────────────────────────────
c() { printf '\033[%sm' "$1"; }
step() { printf "\n$(c '1;36')==> %s$(c 0)\n" "$*"; }
ok()   { printf "  $(c '1;32')OK$(c 0) %s\n" "$*"; }
warn() { printf "  $(c '1;33')WARN$(c 0) %s\n" "$*"; }
die()  { printf "  $(c '1;31')FAIL$(c 0) %s\n" "$*"; exit 1; }

DCOMPOSE="docker compose"
psql_db() { docker exec -e PGPASSWORD="$DB_PASS" "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"; }
# host-side env so pnpm-run migrations/seeds reach the published Postgres port
export DB_HOST=localhost DB_PORT=5432 DB_NAME DB_USER DB_PASSWORD="$DB_PASS"

# =============================================================================
step "STAGE 0 — Preflight"
# =============================================================================
command -v docker >/dev/null 2>&1 || die "Docker not found. Install Docker Desktop / Engine."
docker info >/dev/null 2>&1 || die "Docker daemon is not running."
ok "docker $(docker version --format '{{.Server.Version}}' 2>/dev/null)"

# external network the compose file expects
if ! docker network inspect baalvion-net >/dev/null 2>&1; then
  docker network create baalvion-net >/dev/null && ok "created network baalvion-net"
else ok "network baalvion-net"; fi

# platform RS256 keypair (services verify JWTs with the public key)
mkdir -p docker/secrets
if [ ! -f docker/secrets/jwt_private_key.pem ]; then
  if command -v openssl >/dev/null 2>&1; then
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out docker/secrets/jwt_private_key.pem >/dev/null 2>&1
    openssl rsa -in docker/secrets/jwt_private_key.pem -pubout -out docker/secrets/jwt_public_key.pem >/dev/null 2>&1
    ok "generated RS256 keypair (docker/secrets/)"
  else die "No JWT keypair and openssl missing. Run: pnpm run generate:keys"; fi
else ok "RS256 keypair present"; fi

# .env (compose interpolates ${JWT_PUBLIC_KEY} etc.)
if [ ! -f .env ]; then
  [ -f .env.example ] && cp .env.example .env && ok "created .env from .env.example" || die "no .env and no .env.example"
  # inject the keypair as single-line PEM (\n-escaped) + dev secrets
  PRIV_1L=$(awk 'BEGIN{ORS="\\n"}{print}' docker/secrets/jwt_private_key.pem)
  PUB_1L=$(awk 'BEGIN{ORS="\\n"}{print}' docker/secrets/jwt_public_key.pem)
  {
    echo ""
    echo "JWT_PRIVATE_KEY=$PRIV_1L"
    echo "JWT_PUBLIC_KEY=$PUB_1L"
    echo "INTERNAL_SERVICE_SECRET=${INTERNAL_SERVICE_SECRET:-baalvion-internal-dev-secret}"
    echo "INTERNAL_API_KEY=${INTERNAL_API_KEY:-baalvion-rbac-internal-dev-key}"
    echo "LEDGER_INTERNAL_KEY=${LEDGER_INTERNAL_KEY:-baalvion-ledger-dev-key}"
    echo "CART_SESSION_SECRET=${CART_SESSION_SECRET:-baalvion-cart-dev-secret}"
  } >> .env
  ok "injected keypair + dev secrets into .env"
else ok ".env present (left as-is)"; fi
# load .env into this shell (for INTERNAL_SERVICE_SECRET used by the payment harness)
set -a; . ./.env 2>/dev/null || true; set +a

# host toolchain for migrations/seeds
command -v node >/dev/null 2>&1 || die "Node.js 20 not found (needed for migrations/seeds/harnesses)."
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
fi
command -v pnpm >/dev/null 2>&1 || die "pnpm not found. Enable corepack: 'corepack enable' (Node 20)."
ok "node $(node -v) · pnpm $(pnpm -v)"

if [ "$SKIP_INSTALL" -eq 0 ] && [ ! -d node_modules ]; then
  step "STAGE 0b — pnpm install (first run; provides sequelize-cli + service deps)"
  pnpm install --frozen-lockfile || pnpm install || die "pnpm install failed"
  ok "workspace installed"
fi

# =============================================================================
step "STAGE 1 — Infrastructure (Postgres + Redis)"
# =============================================================================
if [ "$FRESH" -eq 1 ]; then
  warn "--fresh: removing Postgres/Redis volumes (DESTROYS all data)"
  $DCOMPOSE down -v >/dev/null 2>&1 || true
fi
$DCOMPOSE up -d postgres redis >/dev/null 2>&1 || die "failed to start postgres/redis"
printf "  waiting for postgres"
for i in $(seq 1 30); do
  h=$(docker inspect --format='{{.State.Health.Status}}' "$PG_CONTAINER" 2>/dev/null || echo none)
  [ "$h" = "healthy" ] && break; printf "."; sleep 2
done; printf "\n"
[ "$(docker inspect --format='{{.State.Health.Status}}' "$PG_CONTAINER" 2>/dev/null)" = "healthy" ] \
  && ok "postgres healthy on :5432" || warn "postgres health not confirmed — continuing"

# =============================================================================
step "STAGE 2 — Migrations (beta-vertical schemas)"
# =============================================================================
# rbac-service: sync() creates its tables + seeds the platform tenant + 4 system roles.
pnpm --filter rbac-service exec node scripts/seed.js \
  && ok "rbac schema + default hierarchy (platform tenant, system roles)" \
  || warn "rbac seed reported an issue (idempotent — check output)"
# Sequelize CLI services (devDep sequelize-cli; runs host-side against localhost:5432).
for svc in commerce-service order-service inventory-service cms-service; do
  if pnpm --filter "$svc" exec sequelize-cli db:migrate >/dev/null 2>&1; then ok "migrated $svc"
  else warn "sequelize-cli db:migrate did not complete for $svc (already-applied is OK; see logs if a fresh volume)"; fi
done
# ledger-service & payment-service self-migrate on boot (Stage 3).

# =============================================================================
step "STAGE 3 — Services (beta vertical)"
# =============================================================================
$DCOMPOSE up -d --build "${BETA_SERVICES[@]}" >/dev/null 2>&1 \
  && ok "started: ${BETA_SERVICES[*]}" || die "failed to start core beta services"
$DCOMPOSE up -d --build "${EXTRA_SERVICES[@]}" >/dev/null 2>&1 \
  && ok "started: ${EXTRA_SERVICES[*]}" || warn "commerce/inventory containers not started (storefront-only; harnesses don't require them)"
sleep 6   # allow boot-time self-migration (ledger/payment) + listeners

# =============================================================================
step "STAGE 4 — Seed & provision (idempotent)"
# =============================================================================
# 1) commerce catalog (the Amarisé store + 20 published products)
pnpm --filter commerce-service exec node scripts/seedAmarise.js \
  && ok "seeded commerce catalog (Amarisé store + products)" \
  || warn "seedAmarise reported an issue"

# 2) RBAC commerce provisioning (commerce roles/permissions + country/org/store tenants)
PROV_TOKEN="$(node Backend/scripts/mint-token.cjs --sub "$ADMIN_UID" --roles super_admin 2>/dev/null)"
if [ -n "$PROV_TOKEN" ]; then
  RBAC_PROVISION_TOKEN="$PROV_TOKEN" RBAC_BASE_URL="http://localhost:3055" \
    pnpm --filter commerce-service exec node scripts/provisionCommerceRbac.cjs \
    && ok "provisioned commerce RBAC (roles, grants, store→tenant sync)" \
    || warn "provisionCommerceRbac reported an issue (idempotent)"
else warn "could not mint super-admin token — skipped RBAC provisioning"; fi

# 3) Payment vault (CMS-encrypted provider config, mock mode)
pnpm --filter cms-service exec node scripts/seedBaalvionMining.cjs >/dev/null 2>&1 || true
pnpm --filter cms-service exec node scripts/configurePaymentSites.cjs \
  && ok "configured payment providers in CMS vault (mock mode)" \
  || warn "configurePaymentSites reported an issue (needs the CMS websites to exist)"

# =============================================================================
step "STAGE 5 — Fixtures (test customer, role assignments, admin)"
# =============================================================================
# Test customer (owned by buyer user) — idempotent.
psql_db -c "INSERT INTO orders.orders_customers (id, store_id, user_id, email, first_name, last_name, is_active, created_at, updated_at)
  VALUES ('$CUSTOMER_ID','$STORE_ID',$BUYER_UID,'warroom.buyer@baalvion.test','Warroom','Buyer',true,now(),now())
  ON CONFLICT (id) DO NOTHING;" >/dev/null 2>&1 \
  && ok "test customer $CUSTOMER_ID (user $BUYER_UID)" || warn "customer insert skipped"

# Store-team role assignments (platform tenant, scoped to the store) — idempotent.
assign_role() { # $1=user_id $2=role_key
  psql_db -c "INSERT INTO rbac.role_assignments (user_id, role_id, tenant_id, scope_type, scope_id, status, created_at, updated_at)
    SELECT '$1', r.id, t.id, 'organization', '$STORE_ID', 'active', now(), now()
    FROM rbac.roles r, rbac.tenants t WHERE r.key='$2' AND t.type='platform'
    AND NOT EXISTS (SELECT 1 FROM rbac.role_assignments a WHERE a.user_id='$1' AND a.role_id=r.id AND a.scope_id='$STORE_ID');" >/dev/null 2>&1
}
assign_role "$OPS_UID" ops_manager   && ok "assigned ops_manager → user $OPS_UID @ store"   || warn "ops_manager assignment skipped"
assign_role "$VIEWER_UID" store_viewer && ok "assigned store_viewer → user $VIEWER_UID @ store" || warn "store_viewer assignment skipped"
# Admin = platform super_admin assignment (the admin token is minted; see summary).
assign_role_platform() {
  psql_db -c "INSERT INTO rbac.role_assignments (user_id, role_id, tenant_id, scope_type, scope_id, status, created_at, updated_at)
    SELECT '$1', r.id, t.id, 'platform', NULL, 'active', now(), now()
    FROM rbac.roles r, rbac.tenants t WHERE r.key='super_admin' AND t.type='platform'
    AND NOT EXISTS (SELECT 1 FROM rbac.role_assignments a WHERE a.user_id='$1' AND a.role_id=r.id);" >/dev/null 2>&1
}
assign_role_platform "$ADMIN_UID" && ok "admin (super_admin) → user $ADMIN_UID @ platform" || warn "admin assignment skipped"

# Emit beta-fixtures.json (resolved product id keeps harnesses stable across re-seeds).
PRODUCT_ID="$(psql_db -tAc "SELECT id FROM commerce.commerce_products WHERE store_id='$STORE_ID' AND status='published' ORDER BY created_at LIMIT 1;" 2>/dev/null | tr -d '[:space:]')"
[ -z "$PRODUCT_ID" ] && PRODUCT_ID="ec572c4a-4745-4679-8edd-493ee557a2c5"
cat > warroom/beta-fixtures.json <<JSON
{
  "store": "$STORE_ID",
  "product": "$PRODUCT_ID",
  "customer": "$CUSTOMER_ID",
  "customerUserId": "$BUYER_UID",
  "shopperUserId": "9000002",
  "opsUserId": "$OPS_UID",
  "viewerUserId": "$VIEWER_UID",
  "adminUserId": "$ADMIN_UID",
  "paymentSite": "baalvion-mining",
  "paymentWebhookSecret": "rzp_whsec_mining_e2e",
  "crossTenantSite": "baalvionstack-shop",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON
ok "wrote warroom/beta-fixtures.json (product=$PRODUCT_ID)"

# =============================================================================
step "STAGE 6 — Health verification"
# =============================================================================
# service -> full health URL (cms exposes /api/v1/health; the rest use /health)
HEALTH_URLS=(
  "rbac-service|http://localhost:3055/health"
  "order-service|http://localhost:3013/health"
  "payment-service|http://localhost:3019/health"
  "cms-service|http://localhost:3011/api/v1/health"
)
FAILED=0
for entry in "${HEALTH_URLS[@]}"; do
  svc="${entry%%|*}"; url="${entry##*|}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then ok "$svc -> 200 ($url)"
  else warn "$svc -> $code ($url)"; FAILED=$((FAILED+1)); fi
done

echo ""
printf "$(c '1;35')=====================================================$(c 0)\n"
printf "$(c '1;35')   BAALVION BETA BOOTSTRAP — COMPLETE$(c 0)\n"
printf "$(c '1;35')=====================================================$(c 0)\n"
echo "  Store        : $STORE_ID (Amarisé Maison Avenue)"
echo "  Product      : $PRODUCT_ID"
echo "  Buyer        : user $BUYER_UID  (customer $CUSTOMER_ID)"
echo "  Ops manager  : user $OPS_UID   Store viewer: user $VIEWER_UID"
echo "  Admin token  : node Backend/scripts/mint-token.cjs --sub $ADMIN_UID --roles super_admin"
echo ""
echo "  Verify the vertical:"
echo "    node warroom/revenue_e2e.cjs --refund"
echo "    node warroom/enforcement_e2e.cjs"
echo "    node warroom/payment_e2e.cjs"
echo "    node warroom/security_e2e.cjs"
echo ""
if [ "$FAILED" -gt 0 ]; then warn "$FAILED service(s) not healthy — see above"; exit 1; fi
ok "all beta services healthy — environment is READY"
