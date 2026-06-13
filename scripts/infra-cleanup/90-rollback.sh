#!/usr/bin/env bash
# 90-rollback.sh — undo the cleanup. Containers/images regenerate from compose; finance
# data restores from the 00-snapshot.sh pg_dump. DRY-RUN by default.
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/baalvion-infra-backups}"
run() { if [ "$DRY_RUN" = "0" ]; then echo "  + $*"; "$@"; else echo "  [dry-run] $*"; fi; }

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo "../..")"
cd "$ROOT"

echo "DRY_RUN=$DRY_RUN"
echo

echo "== Revert the committed config changes (compose + Traefik) =="
echo "   git checkout main -- docker-compose.yml docker-compose.baalvion-os.yml \\"
echo "       docker-compose.observability.yml Backend/infra/api-gateway/dynamic.yml \\"
echo "       Backend/infra/api-gateway/docker-compose.gateway.yml"
echo "   then re-apply with 40-apply-config.sh (or restart the affected containers)."
echo

echo "== Recreate removed stale containers from compose (if you removed them) =="
echo "   NOTE: auth/commerce/inventory publish host ports that collide with the host pm2"
echo "   fleet — only recreate these if you have stopped the corresponding host process."
run docker compose --profile backend up -d commerce-service inventory-service
run docker compose --profile identity up -d auth-service
echo "   order-service is intentionally retired (OMS owns orders) — do NOT recreate."
echo "   open-webui (if wanted): docker run -d --name optimistic_mirzakhani -p 3000:8080 \\"
echo "       -v open-webui:/app/backend/data ghcr.io/open-webui/open-webui:main"
echo

echo "== Restart the finance stack (volumes were preserved, so no data loss) =="
run docker compose -f Backend/services/commerce/financial-services-java/docker-compose.yml up -d
echo

echo "== LAST RESORT: restore finance DB from the logical dump =="
LATEST="$(cat "$BACKUP_DIR/LATEST" 2>/dev/null || true)"
if [ -n "$LATEST" ] && ls "$LATEST"/baalvion-finance-*.dump >/dev/null 2>&1; then
  DUMP="$(ls -t "$LATEST"/baalvion-finance-*.dump | head -1)"
  echo "   dump: $DUMP"
  echo "   cat '$DUMP' | docker exec -i baalvion-financial-postgres-1 pg_restore -U postgres -d baalvion --clean --if-exists"
else
  echo "   (no dump found under $BACKUP_DIR — only needed if a volume was lost)"
fi
