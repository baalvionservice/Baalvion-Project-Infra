#!/usr/bin/env bash
# 20-reclaim-images-volumes.sh — reclaim disk from images/caches that back NO running
# container. Hard preserve-list. DRY-RUN by default. Never removes *_data / finance volumes.
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"
run() { if [ "$DRY_RUN" = "0" ]; then echo "  + $*"; "$@" || echo "    (skipped: not present / in use)"; else echo "  [dry-run] $*"; fi; }

echo "DRY_RUN=$DRY_RUN  (set DRY_RUN=0 to execute)"
echo

# ── Images that are confirmed dead (0 containers) and safe to drop ──────────────
# Old Node finance images, superseded by the Java finance suite:
DEAD_IMAGES=(
  baalvionprojects-payment-service:latest
  baalvionprojects-ledger-service:latest
  baalvionprojects-notification-service:latest
  baalvionprojects-order-service:latest
)
# Unused base/build images (re-pull/rebuild on demand). NOTE: the 6 baalvion-financial-*
# Java images are deliberately NOT here — they are pinned by the restartable finance stack.
UNUSED_BASES=(
  opensearchproject/opensearch:2
  golang:1.25
  golang:1.22
  neo4j:5-community
  maven:3.9-eclipse-temurin-17
  node:22-slim
  node:20-alpine
)

echo "== dangling <none> image layers =="
run docker image prune -f

echo "== dead Node finance images =="
for img in "${DEAD_IMAGES[@]}"; do run docker image rm "$img"; done

echo "== unused base/build images =="
for img in "${UNUSED_BASES[@]}"; do run docker image rm "$img"; done

echo
echo "== Open WebUI image (~6.6 GB) — only if its container is already removed =="
if docker ps -a --format '{{.Names}}' | grep -qx optimistic_mirzakhani; then
  echo "  optimistic_mirzakhani still present — run 10-remove-stale-containers.sh first. Skipping image."
else
  run docker image rm ghcr.io/open-webui/open-webui:main
fi

echo
echo "== Maven cache volumes (regenerate on next build) =="
for v in baalvion-m2 baalvion_m2 fin-m2; do run docker volume rm "$v"; done

echo
echo "== orphan (dangling) ANONYMOUS volumes only — NAMED volumes are always preserved =="
# Only Docker-generated anonymous volumes (64-hex names) are eligible for removal. Any
# NAMED volume (e.g. open-webui, *_data) is preserved even when dangling, so removing a
# container never causes its named state to be pruned here.
PRESERVE_RE='(_data$|pgdata|postgres|redis|keycloak|minio|grafana|prometheus|pgadmin|financial|open-webui)'
mapfile -t DANGLING < <(docker volume ls -q -f dangling=true)
for v in "${DANGLING[@]:-}"; do
  [ -z "$v" ] && continue
  if ! echo "$v" | grep -qE '^[0-9a-f]{64}$'; then
    echo "  PRESERVE (named volume, not anonymous): $v"
    continue
  fi
  if echo "$v" | grep -qiE "$PRESERVE_RE"; then
    echo "  PRESERVE (matched guard): $v"
    continue
  fi
  run docker volume rm "$v"
done

echo
echo "Done. NEVER removed: *_data, *pgdata*, finance kafka/zookeeper/redis volumes,"
echo "the 6 baalvion-financial-* Java images, or kind/desktop/envoy images."
echo "DO-NOT-AUTO-REMOVE (the 'kind' network still exists): kindest/node, docker/desktop-*, envoyproxy/envoy."
