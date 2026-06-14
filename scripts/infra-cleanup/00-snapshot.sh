#!/usr/bin/env bash
# 00-snapshot.sh — capture full pre-cleanup state + a logical backup of the finance DB.
# Read-only against Docker; the ONLY write is pg_dump output to BACKUP_DIR (outside the repo).
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/baalvion-infra-backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/$STAMP"
mkdir -p "$OUT"

echo "==> Snapshot dir: $OUT"

echo "==> docker ps -a"
docker ps -a > "$OUT/ps_all.txt" 2>&1 || true
echo "==> docker volume ls"
docker volume ls > "$OUT/volumes.txt" 2>&1 || true
echo "==> docker network ls"
docker network ls > "$OUT/networks.txt" 2>&1 || true
echo "==> docker inspect (all containers)"
docker inspect $(docker ps -aq) > "$OUT/inspect_all.json" 2>&1 || true
echo "==> docker images"
docker images > "$OUT/images.txt" 2>&1 || true

# Logical backup of the ISOLATED finance DB (PG-B). This is the only copy of the
# finance double-entry data, so it is dumped before any finance-stack action.
FIN_PG="baalvion-financial-postgres-1"
if docker ps --format '{{.Names}}' | grep -q "^${FIN_PG}$"; then
  echo "==> pg_dump finance DB 'baalvion' from ${FIN_PG} (custom format)"
  docker exec "$FIN_PG" pg_dump -U postgres -Fc baalvion > "$OUT/baalvion-finance-${STAMP}.dump" 2>"$OUT/pg_dump.log" \
    && echo "    OK: $OUT/baalvion-finance-${STAMP}.dump ($(wc -c < "$OUT/baalvion-finance-${STAMP}.dump") bytes)" \
    || echo "    WARN: pg_dump failed — see $OUT/pg_dump.log (do NOT proceed to finance stop)"
else
  echo "==> ${FIN_PG} not running — skipping finance pg_dump (start it first if you intend to stop the finance stack)"
fi

# Pointer so downstream gated scripts can verify a dump exists.
echo "$OUT" > "$BACKUP_DIR/LATEST"
echo "==> Done. LATEST -> $OUT"
