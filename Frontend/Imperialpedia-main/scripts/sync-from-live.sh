#!/usr/bin/env bash
# Refresh the LOCAL Imperialpedia database (and uploaded images) from the LIVE site.
# Read-only on live: it only runs mysqldump and reads the uploads volume. Live is never changed.
#   ./scripts/sync-from-live.sh            database + images
#   ./scripts/sync-from-live.sh --db-only  database only
set -euo pipefail

HOST=baalvion-prod
LIVE_DB_CONTAINER=baalvion-app-imperialpedia-php-db-1
LIVE_DB=legacy_imperialpedia
UPLOADS_VOLUME=baalvion_legacy_imperialpedia_uploads
LOCAL_DB_CONTAINER=imperial_db
LOCAL_DB=u945162271_imperial_pedia
LOCAL_ROOT_PASS=rootpassword
HERE="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

docker ps --format '{{.Names}}' | grep -qx "$LOCAL_DB_CONTAINER" || { echo "Local container $LOCAL_DB_CONTAINER is not running"; exit 1; }

echo "1/3 dumping live database..."
ssh -o BatchMode=yes "$HOST" "docker exec $LIVE_DB_CONTAINER sh -c 'mysqldump -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --single-transaction --routines --default-character-set=utf8mb4 $LIVE_DB' 2>/dev/null" > "$TMP/live.sql"
tail -c 200 "$TMP/live.sql" | grep -q "Dump completed" || { echo "Dump looks incomplete, local database left untouched"; exit 1; }

echo "2/3 replacing local database..."
mkdir -p "$HERE/.local-db-backups"
docker exec "$LOCAL_DB_CONTAINER" mysqldump -uroot -p"$LOCAL_ROOT_PASS" --single-transaction "$LOCAL_DB" 2>/dev/null > "$HERE/.local-db-backups/before-sync-$(date +%Y%m%d-%H%M%S).sql" || true
docker exec -i "$LOCAL_DB_CONTAINER" mysql -uroot -p"$LOCAL_ROOT_PASS" -e "DROP DATABASE IF EXISTS \`$LOCAL_DB\`; CREATE DATABASE \`$LOCAL_DB\` CHARACTER SET utf8mb4;" 2>/dev/null
docker exec -i "$LOCAL_DB_CONTAINER" mysql -uroot -p"$LOCAL_ROOT_PASS" "$LOCAL_DB" < "$TMP/live.sql" 2>/dev/null
docker exec "$LOCAL_DB_CONTAINER" mysql -uroot -p"$LOCAL_ROOT_PASS" "$LOCAL_DB" -N -e "select 'posts',count(*),sum(status='published') from post" 2>/dev/null

if [ "${1:-}" != "--db-only" ]; then
  echo "3/3 copying uploaded images..."
  mkdir -p "$HERE/uploads"
  ssh -o BatchMode=yes "$HOST" "docker run --rm -v $UPLOADS_VOLUME:/u alpine tar cf - -C /u ." | tar xf - -C "$HERE/uploads" 2>/dev/null
  echo "images: $(find "$HERE/uploads" -type f | wc -l | tr -d ' ') files"
fi
echo "done: local now mirrors live."
