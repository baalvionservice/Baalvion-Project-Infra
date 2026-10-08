#!/usr/bin/env bash
# Run ON the VPS (baalvion-prod) as root: makes www the canonical host for
# imperialpedia.com and lawelitenetwork.com, with automatic rollback.
#
# Preconditions (see docs/operations/www-canonical-cutover.md):
#   - image baalvion-law-elite-web:www-20261008 is loaded (built with NEXT_PUBLIC_APP_URL=https://www.lawelitenetwork.com)
#   - backups exist: caddy/Caddyfile.bak-wwwcutover-20261008, docker-compose.app.yml.bak-wwwcutover-20261008,
#     and the :pre-www-20261008 tags for both images
#   - no Cloudflare redirect rules on either zone
set -u
cd /opt/baalvion/stack
TS=wwwcutover-20261008

rollback() {
  echo "!! ROLLBACK"
  python3 - <<PY
d = open('caddy/Caddyfile.bak-$TS').read()
f = open('caddy/Caddyfile', 'r+'); f.seek(0); f.write(d); f.truncate(); f.close()
PY
  cp -p docker-compose.app.yml.bak-$TS docker-compose.app.yml
  docker tag baalvion-law-elite-web:pre-www-20261008 baalvion-law-elite-web:local
  docker compose -f docker-compose.data.yml -f docker-compose.app.yml up -d --no-deps app-law-elite-web app-imperialpedia-php-web
  docker exec baalvion-caddy-1 caddy reload --config /etc/caddy/Caddyfile
  exit 1
}

# 1. New Caddy config. Written in place later (never mv / sed -i: it is a single-file bind mount).
python3 - <<'PY'
p = 'caddy/Caddyfile'
s = open(p).read()
for d, port, svc in (('imperialpedia.com', '80', 'app-imperialpedia-php-web'),
                     ('lawelitenetwork.com', '9002', 'app-law-elite-web')):
    old = f"www.{d} {{\n\tredir https://{d}{{uri}} permanent\n}}\n\n{d} {{\n\tencode gzip zstd\n\treverse_proxy {svc}:{port}\n}}"
    new = f"www.{d} {{\n\tencode gzip zstd\n\treverse_proxy {svc}:{port}\n}}\n\n{d} {{\n\tredir https://www.{d}{{uri}} permanent\n}}"
    assert old in s, d
    s = s.replace(old, new)
open('/tmp/Caddyfile.new', 'w').write(s)
PY
docker run --rm -v /tmp/Caddyfile.new:/etc/caddy/Caddyfile:ro caddy:2-alpine \
  caddy validate --config /etc/caddy/Caddyfile 2>&1 | tail -2 | grep -qi valid || { echo "caddy config invalid"; exit 1; }

# 2. Compose env + image tag
sed -i 's/CANONICAL_HOST: imperialpedia.com/CANONICAL_HOST: www.imperialpedia.com/' docker-compose.app.yml
grep -c "CANONICAL_HOST: www.imperialpedia.com" docker-compose.app.yml
docker tag baalvion-law-elite-web:www-20261008 baalvion-law-elite-web:local

# 3. Swap containers, then Caddy, back to back (a loop is possible only in the seconds between)
docker compose -f docker-compose.data.yml -f docker-compose.app.yml up -d --no-deps \
  app-law-elite-web app-imperialpedia-php-web || rollback
python3 - <<'PY'
d = open('/tmp/Caddyfile.new').read()
f = open('/opt/baalvion/stack/caddy/Caddyfile', 'r+'); f.seek(0); f.write(d); f.truncate(); f.close()
PY
docker exec baalvion-caddy-1 caddy reload --config /etc/caddy/Caddyfile 2>&1 | tail -1
sleep 20

# 4. Smoke test through the real edge
ok=1
for d in imperialpedia.com lawelitenetwork.com; do
  w=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "https://www.$d/")
  b=$(curl -s -o /dev/null -m 15 -w '%{http_code} %{redirect_url}' "https://$d/")
  echo "$d www=$w bare=$b"
  [ "$w" = 200 ] || ok=0
done
[ $ok = 1 ] || rollback
echo CUTOVER-OK
