#!/usr/bin/env bash
# Deploy the PHP code in this folder to the LIVE site (imperialpedia.com).
# Content edits do not need this (they are instant in the live admin). Only code changes do.
# Steps: backup server code -> upload -> build new image -> smoke-test -> ask -> swap in. Rollback tag: :previous
set -euo pipefail
HOST=baalvion-prod
STAGE=/opt/baalvion/app/legacy-imperialpedia-stage
BACKUPS=/opt/baalvion/backups/imperialpedia-php
IMAGE=baalvion-legacy-imperialpedia-web
HERE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERE"

if [ -n "$(git status --porcelain -- .)" ]; then echo "Uncommitted changes here. Commit first so live matches git."; exit 1; fi

echo "1/5 backing up the server's current code..."
ssh -o BatchMode=yes $HOST "cd $STAGE && tar czf $BACKUPS/code-pre-deploy-\$(date +%Y%m%d-%H%M%S).tgz application assets index.php sql .htaccess"

echo "2/5 uploading code from commit $(git rev-parse --short HEAD)..."
git archive HEAD application assets index.php sql .htaccess | ssh -o BatchMode=yes $HOST "cd $STAGE && tar xf - 2>/dev/null"

echo "3/5 building image..."
ssh -o BatchMode=yes $HOST "cd $STAGE && docker tag $IMAGE:local $IMAGE:previous && docker build -t $IMAGE:new . 2>&1 | tail -1"

echo "4/5 smoke test on a private container..."
ssh -o BatchMode=yes $HOST "
NET=\$(docker inspect baalvion-app-imperialpedia-php-web-1 --format '{{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}}{{end}}')
docker inspect baalvion-app-imperialpedia-php-web-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^(CI_ENV|DB_|CI_ENCRYPTION_KEY|CANONICAL_HOST)' > /tmp/imp-smoke.env
docker rm -f imp-php-smoketest >/dev/null 2>&1 || true
docker run -d --rm --name imp-php-smoketest --network \$NET --env-file /tmp/imp-smoke.env -v baalvion_legacy_imperialpedia_uploads:/var/www/html/uploads $IMAGE:new >/dev/null; sleep 6
T=\$(docker inspect imp-php-smoketest --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
bad=0; for u in '' about author sitemap.xml editor/adobe insurance/india; do c=\$(curl -s -o /dev/null -m 20 -w '%{http_code}' -H 'Host: imperialpedia.com' http://\$T/\$u); echo \"  /\$u \$c\"; [ \$c = 200 ] || bad=1; done
docker stop imp-php-smoketest >/dev/null; rm -f /tmp/imp-smoke.env; exit \$bad" || { echo "Smoke test failed. Live NOT changed."; exit 1; }

read -r -p "5/5 swap the new image into LIVE now? [y/N] " ans
case "$ans" in y|Y|yes|YES|Yes) ;; *) echo "Stopped. Live NOT changed (image :new is built and waiting)."; exit 0;; esac
ssh -o BatchMode=yes $HOST "docker tag $IMAGE:new $IMAGE:local && cd /opt/baalvion/stack && docker compose -f docker-compose.data.yml -f docker-compose.app.yml -f docker-compose.caddytest.yml up -d --no-build --no-deps app-imperialpedia-php-web 2>&1 | tail -1"
sleep 12
# image thumbnails are written by the web server; make sure it may create the folder
ssh -o BatchMode=yes $HOST "docker exec -u root baalvion-app-imperialpedia-php-web-1 sh -c 'mkdir -p /var/www/html/uploads/post/thumbs && chown -R www-data:www-data /var/www/html/uploads/post/thumbs'" || true
for u in '' editor/adobe/adobe-after-effects sitemap.xml; do echo "  live /$u $(curl -s -o /dev/null -m 25 -w '%{http_code}' https://imperialpedia.com/$u)"; done
echo "Rollback if needed: ssh $HOST, retag $IMAGE:previous as :local, repeat the compose up."
