#!/usr/bin/env bash
# Phase-2 gateway verification: compare DIRECT service reachability vs GATEWAY
# routing for every service. Run AFTER `docker compose -f docker-compose.gateway.yml up -d`
# and with the services running on localhost:<port> (or adjust DIRECT_HOST).
#
#   ./verify-routes.sh                 # status-only
#   TOKEN="<auth-service JWT>" ./verify-routes.sh   # also tests protected routes pass with a token
#
# Expectations (per locked classification):
#   public  (auth, oauth, ml, realtime, law-elite): GATEWAY status == DIRECT status
#   protected: GATEWAY (no token) == 401/403  (proves jwt-auth gate is wired)
#              GATEWAY (with TOKEN) == DIRECT  (proves routing + auth passthrough)
# NOTE: protected routes 401/403 until auth-service exposes /v1/auth/verify (Phase 5).
set -u
DIRECT_HOST="${DIRECT_HOST:-http://localhost}"
GW="${GATEWAY:-http://localhost}"          # gateway entrypoint
GW_HOST="${GW_HOST:-api.baalvion.com}"     # Host header Traefik routes on
code(){ curl -s -k -o /dev/null -w "%{http_code}" "$@" 2>/dev/null || echo "000"; }

# domain service port class healthpath
ROUTES="
identity auth 3001 public /health
identity oauth 3023 public /health
identity session 3022 protected /health
commerce trade 3025 protected /health
commerce order 3013 protected /health
commerce inventory 3014 protected /health
commerce fulfillment 3016 protected /health
commerce commerce 3012 protected /health
commerce market 3007 protected /health
knowledge imperialpedia 3004 protected /health
knowledge cms 3011 protected /health
knowledge law 3015 protected /health
knowledge ml 8000 public /healthz
infrastructure realtime 3040 ws /health
infrastructure notification 3031 protected /health
infrastructure proxy 4000 protected /health
platform admin 3021 protected /health
platform dashboard 3009 protected /health
ecosystem about 3010 protected /health
ecosystem brand-connector 3006 protected /health
ecosystem ctm 3017 protected /health
ecosystem insiders 3050 protected /health
ecosystem elite-circle 3051 protected /health
ecosystem ir 3008 protected /health
ecosystem jobs 3002 protected /health
ecosystem mining 3003 protected /health
ecosystem real-estate 3005 protected /health
ecosystem law-elite 8090 public /health
"
printf "%-26s %-8s %-7s %-8s %s\n" "ROUTE" "DIRECT" "GW" "GW+TOK" "VERDICT"
echo "$ROUTES" | while read -r dom svc port class hp; do
  [ -z "${dom:-}" ] && continue
  direct=$(code "$DIRECT_HOST:$port$hp")
  gw=$(code -H "Host: $GW_HOST" "$GW/api/v1/$dom/$svc$hp")
  gwtok="-"
  [ -n "${TOKEN:-}" ] && gwtok=$(code -H "Host: $GW_HOST" -H "Authorization: Bearer $TOKEN" "$GW/api/v1/$dom/$svc$hp")
  verdict="CHECK"
  case "$class" in
    public|ws) [ "$gw" = "$direct" ] && verdict="PASS" || verdict="MISMATCH";;
    protected) if [ "$gw" = "401" ] || [ "$gw" = "403" ]; then verdict="GATE-OK"; [ -n "${TOKEN:-}" ] && { [ "$gwtok" = "$direct" ] && verdict="PASS" || verdict="TOKEN-MISMATCH"; }; else verdict="GATE-OPEN!"; fi;;
  esac
  printf "%-26s %-8s %-7s %-8s %s\n" "$dom/$svc" "$direct" "$gw" "$gwtok" "$verdict"
done
echo "--- PASS=routing+auth correct · GATE-OK=protected route wired (add /v1/auth/verify for PASS) · MISMATCH/GATE-OPEN=investigate ---"
