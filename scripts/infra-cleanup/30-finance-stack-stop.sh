#!/usr/bin/env bash
# 30-finance-stack-stop.sh — STOP (not delete) the idle finance stack, preserving ALL data.
# GATED: requires CONFIRM=yes AND a finance pg_dump from 00-snapshot.sh. Uses `compose stop`
# / `compose down` WITHOUT -v. It is physically guarded against any `-v` / volume removal.
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"
CONFIRM="${CONFIRM:-no}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/baalvion-infra-backups}"
FIN_DIR="Backend/services/commerce/financial-services-java"

run() { if [ "$DRY_RUN" = "0" ]; then echo "  + $*"; "$@"; else echo "  [dry-run] $*"; fi; }

echo "DRY_RUN=$DRY_RUN  CONFIRM=$CONFIRM"

if [ "$CONFIRM" != "yes" ]; then
  echo "BLOCKED: this stops PAUSED work-in-progress that owns the only copy of finance data."
  echo "Re-run with CONFIRM=yes once the owner approves. Example:"
  echo "  CONFIRM=yes DRY_RUN=0 bash 30-finance-stack-stop.sh"
  exit 1
fi

# Require a finance dump to exist (data backstop).
LATEST="$(cat "$BACKUP_DIR/LATEST" 2>/dev/null || true)"
if [ -z "$LATEST" ] || ! ls "$LATEST"/baalvion-finance-*.dump >/dev/null 2>&1; then
  echo "BLOCKED: no finance pg_dump found under $BACKUP_DIR. Run 00-snapshot.sh first."
  exit 1
fi
echo "==> Verified finance dump present in: $LATEST"

# Resolve repo root so the script works from anywhere.
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo "../..")"
cd "$ROOT"
[ -f "$FIN_DIR/docker-compose.yml" ] || { echo "ERROR: $FIN_DIR/docker-compose.yml not found from $ROOT"; exit 1; }

echo "==> Optional: drain Kafka residual lag (audit/risk groups) before stopping."
echo "    (Bring audit+risk up briefly, or archive; see audit §4 V2. Skipped by default.)"

echo "==> Stopping finance stack (containers stay, volumes preserved):"
# Guarded compose: only 'stop'. Never 'down -v'.
run docker compose -f "$FIN_DIR/docker-compose.yml" -p baalvion-financial stop

echo
echo "Done. Finance stack STOPPED, all volumes intact."
echo "To remove containers later WITHOUT data loss: docker compose -p baalvion-financial down   (NO -v)"
echo "To restore service:                          docker compose -f $FIN_DIR/docker-compose.yml up -d"
