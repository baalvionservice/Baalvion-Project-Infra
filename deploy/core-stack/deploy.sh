#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — roll the CORE 3-service stack on its EC2 host (RUNTIME ONLY).
#
#   This host NEVER builds images. It logs in to Amazon ECR, pulls the tagged
#   images GitHub Actions already built + pushed, and (re)starts containers.
#
# Usage (run from the repo root on the host, e.g. /opt/baalvion-core):
#   bash deploy/core-stack/deploy.sh [IMAGE_TAG]
#
#   IMAGE_TAG — image tag to roll. Defaults to IMAGE_TAG in .env.production
#               (prod-latest). CI passes the exact commit SHA for an immutable roll.
#
# Auth: ECR login uses the EC2 instance's IAM role (ECR read-only). No AWS keys on the box.
# Prereqs (one-time): docker + compose plugin, AWS CLI v2, this repo cloned at the path you
#   run from, deploy/core-stack/.env.production filled, and the read-only ECR instance role.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.production"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.prod.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "FATAL: ${ENV_FILE} not found. Copy .env.production.example → .env.production and fill it." >&2
  exit 1
fi

# Pull the few keys we need here (compose reads the full file via --env-file).
IMAGE_PREFIX="$(grep -E '^IMAGE_PREFIX=' "${ENV_FILE}" | tail -1 | cut -d= -f2- | tr -d '"' | xargs || true)"
AWS_REGION="$(grep -E '^AWS_REGION=' "${ENV_FILE}" | tail -1 | cut -d= -f2- | tr -d '"' | xargs || true)"
ENV_IMAGE_TAG="$(grep -E '^IMAGE_TAG=' "${ENV_FILE}" | tail -1 | cut -d= -f2- | tr -d '"' | xargs || true)"

AWS_REGION="${AWS_REGION:-ap-south-1}"
# IMAGE_TAG precedence: CLI arg > .env.production > prod-latest
IMAGE_TAG="${1:-${ENV_IMAGE_TAG:-prod-latest}}"
export IMAGE_TAG

if [[ -z "${IMAGE_PREFIX}" ]]; then
  echo "FATAL: IMAGE_PREFIX is empty in ${ENV_FILE}." >&2
  echo "       Set it to your ECR registry, e.g. <acct>.dkr.ecr.${AWS_REGION}.amazonaws.com/baalvion" >&2
  exit 1
fi

REGISTRY="${IMAGE_PREFIX%%/*}"   # registry host = everything before the first '/'

echo "▶ Registry : ${REGISTRY}"
echo "▶ Region   : ${AWS_REGION}"
echo "▶ Tag      : ${IMAGE_TAG}"
echo

COMPOSE=(docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}")

# Java payment-service has a longer boot (Flyway + Kafka) — keep this comfortably high.
WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"

# ── health gate ──────────────────────────────────────────────────────────────────
# Poll every started container until healthy (or running, if it has no healthcheck).
# One-shot containers that exited 0 are treated as done. Returns non-zero if anything is
# still unhealthy at the deadline, so CI surfaces a bad roll instead of a false success.
wait_for_health() {
  local timeout="$1" deadline now cid name status health rc
  deadline=$(( $(date +%s) + timeout ))
  while :; do
    local pending=()
    while read -r cid; do
      [[ -z "${cid}" ]] && continue
      name="$(docker inspect -f '{{.Name}}' "${cid}" 2>/dev/null | sed 's#^/##')"
      status="$(docker inspect -f '{{.State.Status}}' "${cid}" 2>/dev/null || echo unknown)"
      health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${cid}" 2>/dev/null || echo none)"
      if [[ "${status}" == "exited" ]]; then
        rc="$(docker inspect -f '{{.State.ExitCode}}' "${cid}" 2>/dev/null || echo 1)"
        [[ "${rc}" == "0" ]] && continue
        pending+=("${name}(exit=${rc})"); continue
      fi
      if [[ "${health}" == "none" ]]; then
        [[ "${status}" == "running" ]] || pending+=("${name}(${status})")
      else
        [[ "${health}" == "healthy" ]] || pending+=("${name}(${health})")
      fi
    done < <("${COMPOSE[@]}" ps -q)

    if [[ ${#pending[@]} -eq 0 ]]; then
      echo "✅ All services report healthy."
      return 0
    fi
    now="$(date +%s)"
    if [[ "${now}" -ge "${deadline}" ]]; then
      echo "⚠️  Not healthy within ${timeout}s: ${pending[*]}" >&2
      return 1
    fi
    echo "  …waiting on: ${pending[*]}"
    sleep 5
  done
}

# ── 1) authenticate to ECR (instance-role creds; no keys stored on host) ─────────
echo "▶ Logging in to Amazon ECR…"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${REGISTRY}"

# ── 2) pull the new images FIRST (old containers keep serving until step 3) ───────
echo "▶ Pulling images…"
"${COMPOSE[@]}" pull

# ── 2.5) ensure the EXTERNAL prod data volume exists (idempotent) ─────────────────
# pgdata is declared `external` in the compose file so a stray `down -v` can never wipe
# production data. Creating it here is a no-op when it already exists and keeps first-time
# hosts working without a manual `docker volume create`.
echo "▶ Ensuring external DB volume core-stack_pgdata exists…"
docker volume create core-stack_pgdata >/dev/null 2>&1 || true

# ── 3) recreate changed containers — NEVER build (invariant) ─────────────────────
echo "▶ Starting / recreating containers…"
"${COMPOSE[@]}" up -d --no-build --remove-orphans

# ── 4) health-gate the roll before declaring success ─────────────────────────────
echo "▶ Verifying service health (timeout ${WAIT_TIMEOUT}s)…"
ROLL_RC=0
wait_for_health "${WAIT_TIMEOUT}" || ROLL_RC=$?

# ── 5) reclaim disk from superseded image layers ─────────────────────────────────
echo "▶ Pruning dangling images…"
docker image prune -f >/dev/null || true

echo
"${COMPOSE[@]}" ps
if [[ "${ROLL_RC}" -ne 0 ]]; then
  echo
  echo "❌ Deploy rolled images (tag ${IMAGE_TAG}) but some services are unhealthy." >&2
  echo "   Inspect: docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} logs <service>" >&2
  echo "   Rollback: bash ${BASH_SOURCE[0]} <previous-git-sha>" >&2
  exit "${ROLL_RC}"
fi
echo
echo "✅ Core stack deploy complete and healthy (tag ${IMAGE_TAG})."
echo "   First-time DB init (once, fresh DB): bash deploy/core-stack/init-data.sh"
echo "   (set CORE_ENV_FILE=deploy/core-stack/.env.production so init-data uses the host env)"
