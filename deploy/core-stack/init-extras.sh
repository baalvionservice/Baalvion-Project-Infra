#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-time DB migration for the ADDED platform + commerce services:
#   rbac · audit · commerce · order · trade   (notification-service has NO DB).
#
# Run this ONCE after the new images are rolled onto a host whose core DB is already
# initialised (i.e. init-data.sh has run for auth + cms + payment). It creates each
# service's isolated SCHEMA in the shared baalvion_db.
#
#   CORE_ENV_FILE=deploy/core-stack/.env.production bash deploy/core-stack/init-extras.sh
#
# SAFE TO RE-RUN — every migration is idempotent:
#   • rbac / audit  → raw SQL, all CREATE … IF NOT EXISTS
#   • commerce / order → sequelize-cli (tracked in SequelizeMeta)
#   • trade → custom runner, tracked in trade.schema_migrations
#
# Until this runs, the new services will crash-loop (no tables) and restart; once their
# schemas exist they go healthy on the next restart. The tail of this script restarts them.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENVFILE="${CORE_ENV_FILE:-deploy/core-stack/.env.prod}"
COMPOSE="deploy/core-stack/docker-compose.prod.yml"
CF="--env-file $ENVFILE -f $COMPOSE"

[ -f "$ENVFILE" ] || { echo "ERROR: $ENVFILE not found. Copy .env.production.example → .env.production and fill it."; exit 1; }

run_mig() {
  local job="$1"
  echo "  >> $job"
  docker compose $CF --profile tools run --rm "$job"
}

echo "[1/5] RBAC schema (rbac)..."
run_mig rbac-migrate
echo "[2/5] Audit schema (audit)..."
run_mig audit-migrate
echo "[3/5] Commerce schema (commerce)..."
run_mig commerce-migrate
echo "[4/5] Orders schema (orders)..."
run_mig order-migrate
echo "[5/5] Trade schema (trade)..."
run_mig trade-migrate

echo ""
echo "DONE. New service schemas migrated."
echo "Restarting the added services so they pick up their now-present tables..."
docker compose $CF restart \
  rbac-service audit-service commerce-service order-service notification-service trade-service || true

echo ""
echo "Verify:  docker compose $CF ps"
echo "Logs:    docker compose $CF logs -f <service>"
