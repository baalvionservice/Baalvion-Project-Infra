#!/usr/bin/env bash
# Deploy trade-service (real sanctions lists, company auto-checks, broker channel, HS duty gate)
# from origin/main to baalvion-prod. Run from anywhere:   bash docs/gti/deploy-backend.sh
#
# What it does, in order. It stops at the first failure (set -e), and nothing after a failed
# step runs:
#   1. exports trade-service from origin/main and builds a THIN overlay image on top of the
#      currently live baalvion-backend:commerce (file copy only: no npm install, no big build)
#   2. tags the live image as a rollback point first
#   3. applies migration 088 (additive only; production already has everything through 087)
#   4. recreates app-commerce on the new image (restarts 7 services for about a minute)
#   5. loads the OFAC, UN and EU sanctions lists
#
# Rollback (printed again at the end):
#   ssh baalvion-prod 'docker tag baalvion-backend:commerce-pre-sanctions-20261013 baalvion-backend:commerce \
#     && cd /opt/baalvion/stack && docker compose -f docker-compose.data.yml -f docker-compose.app.yml \
#        -f docker-compose.caddytest.yml up -d --no-build --no-deps --force-recreate app-commerce'
# (migration 088 only adds columns and a log table; it can stay.)
set -euo pipefail

REPO="${REPO:-/Users/wade/Desktop/Baalvion-Project-Infra-main}"
HOST=baalvion-prod
TAG=commerce
ROLLBACK=commerce-pre-sanctions-20261013
CONTAINER=baalvion-app-commerce-1
SVC=/app/Backend/services/commerce/trade-service

cd "$REPO"
git fetch -q origin main
SHA=$(git rev-parse --short origin/main)
echo "==> deploying origin/main @ $SHA"

# Refuse to continue if the merged work is not in main (checks the files directly).
for f in service/compliance/lists/importer.js service/verification/companyChecks.js \
         service/customs/connectors/brokerConnector.js migrations/088_sanctions_list_provenance.sql; do
  git cat-file -e "origin/main:Backend/services/commerce/trade-service/$f" 2>/dev/null \
    || { echo "missing from main: $f — are the PRs merged?"; exit 1; }
done

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/trade-service"
git archive origin/main Backend/services/commerce/trade-service | tar -x -C "$WORK" --strip-components=3
printf 'FROM baalvion-backend:%s\nCOPY trade-service/ %s/\n' "$ROLLBACK" "$SVC" > "$WORK/Dockerfile"

echo "==> 1/5 copying source to the VPS"
rsync -az --delete "$WORK/" "$HOST:/opt/baalvion/build/overlay-$SHA/"

echo "==> 2/5 tagging the live image as the rollback point, then building the overlay"
ssh "$HOST" "set -e
  docker tag baalvion-backend:$TAG baalvion-backend:$ROLLBACK
  cd /opt/baalvion/build/overlay-$SHA
  nice -n 19 docker build -q -t baalvion-backend:$TAG .
  docker images baalvion-backend --format '{{.Tag}} {{.ID}} {{.CreatedSince}}' | head -3"

echo "==> 3/5 applying migration 088 (only pending migration)"
ssh "$HOST" "set -e
  docker cp /opt/baalvion/build/overlay-$SHA/trade-service/migrations/088_sanctions_list_provenance.sql $CONTAINER:$SVC/migrations/
  docker cp /opt/baalvion/build/overlay-$SHA/trade-service/migrations/088_sanctions_list_provenance.down.sql $CONTAINER:$SVC/migrations/
  docker exec $CONTAINER sh -c 'cd $SVC && node migrate.js 2>&1 | tail -5'"

echo "==> 4/5 recreating app-commerce on the new image (about a minute of restarts)"
ssh "$HOST" "set -e
  cd /opt/baalvion/stack
  docker compose -f docker-compose.data.yml -f docker-compose.app.yml -f docker-compose.caddytest.yml up -d --no-build --no-deps --force-recreate app-commerce
  for i in \$(seq 1 40); do
    s=\$(docker inspect -f '{{.State.Health.Status}}' $CONTAINER 2>/dev/null || echo none)
    echo \"   health: \$s\"; [ \"\$s\" = healthy ] && break; sleep 5
  done
  [ \"\$s\" = healthy ] || { echo 'app-commerce did not become healthy — roll back (see header)'; exit 1; }"

echo "==> 5/5 loading the OFAC, UN and EU sanctions lists"
ssh "$HOST" "docker exec $CONTAINER sh -c 'cd $SVC && node scripts/import-sanctions-lists.js'"

echo
echo "Done. Expect roughly: OFAC ~19,400, UN ~1,010, EU ~6,200 parties."
echo "If anything looks wrong, roll back with the command in this script's header."
