#!/usr/bin/env bash
# Deploy the order journey (migrations 089+090, restricted DB role, secrets) to baalvion-prod.
#   bash docs/gti/deploy-journey.sh
# Order: overlay image from origin/main -> rollback tag -> migrations -> DB role -> secrets in the
# stack .env (append only) + compose environment lines -> recreate app-commerce -> verify.
# NOTE: step 2 re-tags whatever is live as the rollback point, so never run this twice.
# Rollback:
#   ssh baalvion-prod 'docker tag baalvion-backend:commerce-pre-journey-20261013 baalvion-backend:commerce \
#     && cd /opt/baalvion/stack && cp docker-compose.app.yml.bak-journey-20261013 docker-compose.app.yml \
#     && docker compose -f docker-compose.data.yml -f docker-compose.app.yml -f docker-compose.caddytest.yml \
#        up -d --no-build --no-deps --force-recreate app-commerce'
# (the migrations are additive and can stay.)
set -euo pipefail
REPO="${REPO:-/Users/wade/Desktop/Baalvion-Project-Infra-main}"
HOST=baalvion-prod; TAG=commerce; ROLLBACK=commerce-pre-journey-20261013
CONTAINER=baalvion-app-commerce-1; SVC=/app/Backend/services/commerce/trade-service
cd "$REPO"; git fetch -q origin main; SHA=$(git rev-parse --short origin/main)
for f in service/journey/steps.js migrations/090_order_journey_records.sql scripts/create-journey-db-role.sql; do
  git cat-file -e "origin/main:Backend/services/commerce/trade-service/$f" || { echo "missing from main: $f"; exit 1; }
done
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT; mkdir -p "$WORK/trade-service"
git archive origin/main Backend/services/commerce/trade-service | tar -x -C "$WORK" --strip-components=3
printf 'FROM baalvion-backend:%s\nCOPY trade-service/ %s/\n' "$ROLLBACK" "$SVC" > "$WORK/Dockerfile"
echo "==> 1/6 source to VPS ($SHA)"; rsync -az --delete "$WORK/" "$HOST:/opt/baalvion/build/overlay-journey-$SHA/"
echo "==> 2/6 rollback tag + overlay image"
ssh "$HOST" "set -e; docker tag baalvion-backend:$TAG baalvion-backend:$ROLLBACK; cd /opt/baalvion/build/overlay-journey-$SHA; nice -n 19 docker build -q -t baalvion-backend:$TAG ."
echo "==> 3/6 migrations 089, 090"
ssh "$HOST" "set -e; for f in 089_order_journey_parties 090_order_journey_records; do for e in sql down.sql; do docker cp /opt/baalvion/build/overlay-journey-$SHA/trade-service/migrations/\$f.\$e $CONTAINER:$SVC/migrations/; done; done
  docker exec $CONTAINER sh -c 'cd $SVC && node migrate.js 2>&1 | tail -5'"
echo "==> 4/6 restricted role + secrets (generated on the server, never printed)"
ssh "$HOST" "set -e; cd /opt/baalvion/stack
  if ! grep -q '^JOURNEY_DB_PASSWORD=' .env; then
    printf 'JOURNEY_DB_USER=baalvion_journey\nJOURNEY_DB_PASSWORD=%s\nJOURNEY_INTERNAL_SECRET=%s\n' \"\$(openssl rand -hex 24)\" \"\$(openssl rand -hex 32)\" >> .env
  fi
  PW=\$(grep '^JOURNEY_DB_PASSWORD=' .env | cut -d= -f2)
  { printf '%s\n' \"\\\\set journey_password '''\$PW'''\"; cat /opt/baalvion/build/overlay-journey-$SHA/trade-service/scripts/create-journey-db-role.sql; } | docker exec -i baalvion-postgres psql -U baalvion_app -d baalvion -v ON_ERROR_STOP=1 -q"
echo "==> 5/6 compose environment lines (backup first)"
ssh "$HOST" "set -e; cd /opt/baalvion/stack; cp docker-compose.app.yml docker-compose.app.yml.bak-journey-20261013
  grep -q JOURNEY_DB_USER docker-compose.app.yml || python3 - <<'PY'
p='docker-compose.app.yml'; s=open(p).read()
a='      PCL_SHADOW: \"true\"\n'
assert s.count(a)>=1
i=s.index('  app-commerce:'); j=s.index(a,i)+len(a)
add='      # Order journey: restricted DB role (so Postgres enforces the access rules) and the order-service signing secret.\n      JOURNEY_DB_USER: \${JOURNEY_DB_USER}\n      JOURNEY_DB_PASSWORD: \${JOURNEY_DB_PASSWORD}\n      JOURNEY_INTERNAL_SECRET: \${JOURNEY_INTERNAL_SECRET}\n'
open(p,'w').write(s[:j]+add+s[j:])
PY
  docker compose -f docker-compose.data.yml -f docker-compose.app.yml -f docker-compose.caddytest.yml config -q"
echo "==> 6/6 recreate app-commerce"
ssh "$HOST" "set -e; cd /opt/baalvion/stack
  docker compose -f docker-compose.data.yml -f docker-compose.app.yml -f docker-compose.caddytest.yml up -d --no-build --no-deps --force-recreate app-commerce
  for i in \$(seq 1 40); do s=\$(docker inspect -f '{{.State.Health.Status}}' $CONTAINER 2>/dev/null || echo none); echo \"   health: \$s\"; [ \"\$s\" = healthy ] && break; sleep 5; done
  [ \"\$s\" = healthy ] || { echo 'not healthy — roll back (see header)'; exit 1; }
  docker exec $CONTAINER printenv JOURNEY_DB_USER"
echo "Done. Verify enforcement: GET /v1/order_journeys/_status should say database+application."
