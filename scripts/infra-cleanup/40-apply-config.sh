#!/usr/bin/env bash
# 40-apply-config.sh — apply the committed declarative config changes to the live engine.
# DRY-RUN by default.
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"
run() { if [ "$DRY_RUN" = "0" ]; then echo "  + $*"; "$@"; else echo "  [dry-run] $*"; fi; }

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo "../..")"
cd "$ROOT"
GW="Backend/infra/api-gateway/docker-compose.gateway.yml"

echo "DRY_RUN=$DRY_RUN"
echo

# 1) Gateway: load the new dynamic.yml + extra_hosts. NOTE: Traefik `watch:true` does
#    NOT fire on Windows bind mounts (inotify doesn't cross the host->VM boundary), so a
#    recreate/restart is REQUIRED to apply routing changes. `up -d` also applies extra_hosts.
echo "== api-gateway: recreate to load new routing table + extra_hosts =="
run docker compose -f "$GW" up -d --force-recreate

# 2) pgAdmin is now profile-gated + loopback-bound. Recreate under the 'tools' profile
#    (set PGADMIN_DEFAULT_PASSWORD in your .env first).
echo "== pgAdmin: stop the old wide-open container, restart hardened (profile: tools) =="
run docker rm -f baalvion-pgadmin
run docker compose --profile tools up -d pgadmin

# 3) Grafana: pick up the env-sourced admin password (set GRAFANA_ADMIN_PASSWORD in .env).
echo "== Grafana: recreate with env-sourced admin password =="
run docker compose -f docker-compose.observability.yml up -d --force-recreate grafana

# 4) Keycloak is now profile-gated (baalvion-os) + loopback-bound. It is NOT recreated by
#    default — it only backs the experimental baalvion-os subsystem. Start it explicitly
#    only when working on baalvion-os:
echo "== Keycloak: profile-gated now; start only for baalvion-os work =="
echo "   docker compose -f docker-compose.baalvion-os.yml --profile baalvion-os up -d keycloak"

echo
echo "Verify gateway routing after apply:"
echo "  curl -sk -o /dev/null -w '%{http_code}\\n' https://localhost/api/v1/knowledge/law/health   # expect 200"
echo "  curl -sk -o /dev/null -w '%{http_code}\\n' https://localhost/api/v1/identity/auth/.well-known/jwks.json  # expect 200"
