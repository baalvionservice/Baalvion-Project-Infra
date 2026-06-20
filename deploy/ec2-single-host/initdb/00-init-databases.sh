#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Runs ONCE, the first time the Postgres data volume is empty, as the superuser
# ($POSTGRES_USER) connected to $POSTGRES_DB. Creates the per-stack databases and
# the baalvion_app RLS runtime role.
#
#   • $POSTGRES_DB (baalvion_db) is already created by the entrypoint.
#   • ctm_db   — Stack B (ControlTheMarket)
#   • proxy_db — Stack C (Proxy/BaalvionStack: proxy-service, proxy-cms, proxy-payment)
#   • gti_db   — trade.baalvion.com (Global-Trade-Infrastructure) Prisma orchestration store.
#                Prisma `migrate deploy` (gti-migrate one-shot) owns its `public` schema.
#   • baalvion_app — Stack A payment-service connects as this role at runtime (RLS).
#                    It MUST exist before that service runs its Flyway migration.
#
# Note: law-service (schema `legal`), imperialpedia-service (schema `imperialpedia`) and
# trade-service (schema `trade`) all live INSIDE baalvion_db and self-create their schema on
# boot (CREATE SCHEMA IF NOT EXISTS …) — no extra database is needed for them.
#
# Per-schema USAGE grants for baalvion_app are NOT done here (the schemas don't exist
# until each service boots) — run the post-boot grant pass from the runbook (§5).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CTM_DB="${CTM_DB:-ctm_db}"
PROXY_DB="${PROXY_DB:-proxy_db}"
GTI_DB="${GTI_DB:-gti_db}"
APP_USER="${DB_APP_USER:-baalvion_app}"
APP_PASSWORD="${DB_APP_PASSWORD:-}"

create_db () {
  local db="$1"
  if ! psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${db}'" -U "$POSTGRES_USER" -d "$POSTGRES_DB" | grep -q 1; then
    echo "initdb: creating database ${db}"
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE DATABASE \"${db}\""
  fi
}

create_db "$CTM_DB"
create_db "$PROXY_DB"
create_db "$GTI_DB"

if [ -n "$APP_PASSWORD" ]; then
  echo "initdb: ensuring runtime role ${APP_USER}"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       -v app_user="$APP_USER" -v app_pw="$APP_PASSWORD" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_pw');
  END IF;
END$$;
SQL
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       -c "GRANT CONNECT ON DATABASE \"$POSTGRES_DB\" TO \"$APP_USER\""
else
  echo "initdb: WARNING — DB_APP_PASSWORD is empty; ${APP_USER} NOT created."
  echo "initdb: Stack A payment-service will FAIL its Flyway/RLS step until this role exists."
fi
