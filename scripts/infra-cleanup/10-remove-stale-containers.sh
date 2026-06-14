#!/usr/bin/env bash
# 10-remove-stale-containers.sh — remove the 5 verified-stale containers.
# Each removal is gated by a preflight that proves the successor/host service still
# answers, so we never remove something whose replacement is down. CONTAINERS ONLY —
# no image or volume is deleted here. DRY-RUN by default.
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"
run() { if [ "$DRY_RUN" = "0" ]; then echo "  + $*"; "$@"; else echo "  [dry-run] $*"; fi; }

# Returns 0 if an HTTP listener answers on the host port (any status code = listening).
host_up() { curl -s -o /dev/null -m 4 "http://localhost:$1/" 2>/dev/null; }

exists()  { docker ps -a --format '{{.Names}}' | grep -qx "$1"; }
running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }

remove_if_stale() {
  local name="$1" guard_port="${2:-}" guard_label="${3:-}"
  echo "== $name =="
  if ! exists "$name"; then echo "  not present — skip"; return 0; fi
  if running "$name"; then echo "  RUNNING — refusing to remove a running container. Skip."; return 0; fi
  if [ -n "$guard_port" ]; then
    if host_up "$guard_port"; then
      echo "  preflight OK: successor '$guard_label' answers on host :$guard_port"
    else
      echo "  PREFLIGHT FAILED: nothing answers on host :$guard_port ($guard_label). Refusing to remove. Skip."
      return 0
    fi
  fi
  run docker rm "$name"
}

echo "DRY_RUN=$DRY_RUN  (set DRY_RUN=0 to execute)"
echo

# open-webui orphan — not in any compose project; no successor to guard. If you want
# its chat history, back the volume up first (see README), then remove the container.
remove_if_stale optimistic_mirzakhani

# auth-service container — superseded by host pm2 auth on :3001 (same RS256 signing key).
remove_if_stale baalvion-auth 3001 "host auth-service"

# order-service container — deprecated; trade:3025 returns 410 GONE -> OMS. Guard on trade.
remove_if_stale baalvion-orders 3025 "trade-service (410 GONE successor marker)"

# commerce / inventory — never-started build artifacts; host pm2 owns :3012 / :3014.
remove_if_stale baalvion-commerce 3012 "host commerce-service"
remove_if_stale baalvion-inventory 3014 "host inventory-service"

echo
echo "Done. Stale CONTAINERS handled (no volumes/images touched)."
echo "Image reclaim for the dead Node images is in 20-reclaim-images-volumes.sh."
