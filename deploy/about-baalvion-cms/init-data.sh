#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-time DB init + multi-site content seed for the Baalvion CMS stack.
# Run ONCE, from the REPO ROOT, AFTER `docker compose ... up -d --build` is healthy.
# Automates the exact sequence validated end-to-end:
#   auth migrations → cms migrations → super-admin → register sites → seed+publish → verify
#
# Seeds these live sites (all served by the SAME public CMS, by slug):
#   • about-baalvion        → about.baalvion.com
#   • baalvion-ir           → ir.baalvion.com
#   • amarise-maison-avenue → amarisemaisonavenue.com
#   • law-elite-network     → lawelitenetwork.com
#   • baalvion-mining       → mining.baalvion.com
#
#   bash deploy/about-baalvion-cms/init-data.sh
#   # validate against a throwaway env:  CMS_ENV_FILE=deploy/about-baalvion-cms/.env.smoke bash ...
#
# Re-runnable parts (register, seed, publish) are idempotent; the schema migrations
# are NOT — only run this on a FRESH database.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENVFILE="${CMS_ENV_FILE:-deploy/about-baalvion-cms/.env.prod}"
COMPOSE="deploy/about-baalvion-cms/docker-compose.prod.yml"
CF="--env-file $ENVFILE -f $COMPOSE"
AUTH_MIG="Backend/services/identity/auth-service/migrations"

[ -f "$ENVFILE" ] || { echo "ERROR: $ENVFILE not found. Copy .env.prod.example → .env.prod and fill it."; exit 1; }

# Load only the scalar vars (the multi-line PEM keys break `source`).
export $(grep -E '^(POSTGRES_USER|POSTGRES_DB|SUPERADMIN_EMAIL|SUPERADMIN_PASSWORD)=' "$ENVFILE" | xargs)

psql_q() { docker compose $CF exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"; }
seed_run() { docker compose $CF --profile tools run --rm "$@"; }
resolve_wid() { psql_q -tAc "select id from cms.cms_websites where slug='$1'" | tr -d '[:space:]'; }

echo "[1/7] Waiting for postgres + auth-service + cms-service to be healthy..."
for i in $(seq 1 40); do
  pg=$(docker compose $CF ps postgres --format '{{.Health}}' 2>/dev/null || echo "")
  au=$(docker compose $CF ps auth-service --format '{{.Health}}' 2>/dev/null || echo "")
  cm=$(docker compose $CF ps cms-service --format '{{.Health}}' 2>/dev/null || echo "")
  echo "    postgres=$pg auth-service=$au cms-service=$cm"
  [ "$pg" = "healthy" ] && [ "$au" = "healthy" ] && [ "$cm" = "healthy" ] && break
  sleep 5
  [ "$i" = "40" ] && { echo "ERROR: services not healthy after ~200s. Check: docker compose $CF logs"; exit 1; }
done

echo "[2/7] Applying auth schema migrations (001-009)..."
for f in "$AUTH_MIG"/00{1,2,3,4,5,6,7,8}*.sql; do
  echo "    >> $(basename "$f")"
  psql_q -v ON_ERROR_STOP=1 -q < "$f" >/dev/null
done
echo "    >> 009 (RLS, best-effort)"
psql_q -q < "$AUTH_MIG"/009*.sql >/dev/null 2>&1 || echo "    (009 skipped — ok)"

echo "[3/7] Applying CMS schema migrations..."
docker compose $CF --profile tools run --rm cms-migrate

echo "[4/7] Bootstrapping super-admin..."
BOOT=$(docker compose $CF exec -T \
  -e SUPERADMIN_EMAIL="$SUPERADMIN_EMAIL" -e SUPERADMIN_PASSWORD="$SUPERADMIN_PASSWORD" \
  auth-service node scripts/bootstrapSuperAdmin.js)
echo "$BOOT"
# `|| true`: under `set -o pipefail`, `grep | head` can return SIGPIPE(141) when head
# closes the pipe early, which would trip `set -e` and abort right after bootstrap.
ORG_ID=$(printf '%s' "$BOOT" | grep -oE '"orgId":[[:space:]]*"[^"]+"' | head -n1 | cut -d'"' -f4) || true
USER_ID=$(printf '%s' "$BOOT" | grep -oE '"userId":[[:space:]]*"[^"]+"' | head -n1 | cut -d'"' -f4) || true
[ -n "$ORG_ID" ] && [ -n "$USER_ID" ] || { echo "ERROR: could not parse orgId/userId from bootstrap output"; exit 1; }
echo "    orgId=$ORG_ID userId=$USER_ID"

echo "[5/7] Registering website tenants (all sites, owned by the super-admin org)..."
docker compose $CF --profile tools run --rm \
  -e CMS_ORG_ID="$ORG_ID" -e CMS_CREATED_BY="$USER_ID" cms-register

echo "[6/7] Seeding site content (the seed scripts publish by id; a SQL catch-all below"
echo "      publishes any stragglers — e.g. seedBaalvionIr defers publishing, and an"
echo "      occasional create/publish race can leave drafts)..."

echo "  --- about-baalvion (about.baalvion.com) ---"
WID=$(resolve_wid about-baalvion); [ -n "$WID" ] || { echo "ERROR: about-baalvion not registered"; exit 1; }
seed_run -e ABOUT_WEBSITE_ID="$WID" cms-seed node scripts/seedAboutBaalvion.cjs

echo "  --- baalvion-ir (ir.baalvion.com) ---"
WID=$(resolve_wid baalvion-ir); [ -n "$WID" ] || { echo "ERROR: baalvion-ir not registered"; exit 1; }
seed_run -e IR_WEBSITE_ID="$WID" cms-seed node scripts/seedBaalvionIr.cjs
seed_run -e IR_WEBSITE_ID="$WID" cms-seed node scripts/seedBaalvionIrTeam.cjs

echo "  --- amarise-maison-avenue (amarisemaisonavenue.com) ---"
WID=$(resolve_wid amarise-maison-avenue); [ -n "$WID" ] || { echo "ERROR: amarise-maison-avenue not registered"; exit 1; }
seed_run -e AMARISE_WEBSITE_ID="$WID" cms-seed node scripts/seedAmariseEditorial.cjs

echo "  --- law-elite-network (lawelitenetwork.com) ---"
WID=$(resolve_wid law-elite-network); [ -n "$WID" ] || { echo "ERROR: law-elite-network not registered"; exit 1; }
seed_run -e LAW_WEBSITE_ID="$WID" cms-seed node scripts/seedLawElite.cjs
seed_run -e LAW_WEBSITE_ID="$WID" cms-seed node scripts/seedLawArticlesLongform.cjs

echo "  --- baalvion-mining (mining.baalvion.com) ---"
WID=$(resolve_wid baalvion-mining); [ -n "$WID" ] || { echo "ERROR: baalvion-mining not registered"; exit 1; }
seed_run -e MINING_WEBSITE_ID="$WID" cms-seed node scripts/seedBaalvionMining.cjs

echo "  --- publish: mark all public seeded content as published ---"
# publishWebsite.cjs resolves the site via the authenticated websites LIST, which only
# returns sites the user is a MEMBER of — register doesn't add membership, so it can't
# find freshly-registered sites. The public delivery API serves rows where
# status='published' AND visibility='public', so publish those directly (deploy-time bulk
# publish of initial seed content). This also catches any seed that deferred publishing.
psql_q -c "UPDATE cms.cms_contents c SET status='published', published_at=COALESCE(published_at, now()), updated_at=now() FROM cms.cms_websites w WHERE c.website_id=w.id AND w.slug IN ('about-baalvion','baalvion-ir','amarise-maison-avenue','law-elite-network','baalvion-mining') AND c.status<>'published' AND c.visibility='public';"

echo ""
echo "[7/7] Verify — published item count per site (public delivery API the frontends read):"
for slug in about-baalvion baalvion-ir amarise-maison-avenue law-elite-network baalvion-mining; do
  n=$(docker compose $CF exec -T cms-service node -e \
    "fetch('http://localhost:3011/api/v1/public/$slug/content?limit=200').then(r=>r.json()).then(j=>console.log((j.data||[]).length)).catch(()=>console.log('ERR'))" 2>/dev/null | tr -d '[:space:]')
  echo "    $slug: $n published items"
done

echo ""
echo "DONE. Each site above should show a non-zero item count."
echo "Next: in each site's Vercel project set CMS_PUBLIC_URL=https://<your-cms-domain>/api/v1/public"
echo "      and CMS_WEBSITE_SLUG to its slug (about-baalvion / baalvion-ir / amarise-maison-avenue /"
echo "      law-elite-network / baalvion-mining), then redeploy."
