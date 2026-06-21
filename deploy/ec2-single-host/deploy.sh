#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — roll the Baalvion single-host stack on EC2 (RUNTIME ONLY).
#
#   This host NEVER builds images. It logs in to Amazon ECR, pulls the tagged
#   images that GitHub Actions already built + pushed, and (re)starts containers.
#
# Usage (run from the repo root, e.g. /opt/baalvion):
#   bash deploy/ec2-single-host/deploy.sh [IMAGE_TAG]
#
#   IMAGE_TAG  — image tag to roll. Defaults to the value in .env.production
#                (IMAGE_TAG=prod-latest). CI passes the exact commit SHA so the
#                deploy is immutable / reproducible.
#
# Auth: ECR login uses the EC2 instance's IAM role (AmazonECR pull permissions).
#       There are NO AWS keys on the box. `aws sts get-caller-identity` / the
#       AWS CLI pick the role up from instance metadata automatically.
#
# Prereqs on the host (one-time): docker + compose plugin, AWS CLI v2, this repo
# cloned at the path you run from, and deploy/ec2-single-host/.env.production filled.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── locate paths (works no matter where it's invoked from) ──────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.production"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "FATAL: ${ENV_FILE} not found. Copy .env.production.example → .env.production and fill it." >&2
  exit 1
fi

# ── load IMAGE_PREFIX / AWS_REGION / IMAGE_TAG defaults from the env file ────────
# (only export the few keys we need here; compose reads the full file via --env-file)
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

# Registry host = everything before the first '/' in IMAGE_PREFIX.
REGISTRY="${IMAGE_PREFIX%%/*}"

echo "▶ Registry : ${REGISTRY}"
echo "▶ Region   : ${AWS_REGION}"
echo "▶ Tag      : ${IMAGE_TAG}"
echo

COMPOSE=(docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}")

# How long to wait for every long-running service to report healthy after the roll.
# Java services have a 70s start_period, so keep this comfortably above that.
WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"

# ── health gate ──────────────────────────────────────────────────────────────────
# Poll every started container until it is healthy (or running, if it has no
# healthcheck). One-shot containers that already exited 0 (e.g. gti-migrate) are
# treated as done. Returns non-zero if anything is still unhealthy at the deadline,
# so CI surfaces a bad roll instead of reporting a false success.
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
        [[ "${rc}" == "0" ]] && continue          # one-shot job finished cleanly
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

# ── 2) pull the new images FIRST (zero downtime: old containers keep serving) ─────
echo "▶ Pulling images…"
"${COMPOSE[@]}" pull

# ── 3) recreate changed containers — NEVER build (invariant) ─────────────────────
# Only services whose image/config changed are recreated; the rest keep running, so
# this is an inherently rolling restart with the new images already local from step 2.
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
echo "✅ Deploy complete and healthy (tag ${IMAGE_TAG})."
