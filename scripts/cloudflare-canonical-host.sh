#!/usr/bin/env bash
# Sets which host is canonical on the listed Cloudflare zones and 301s the other to it.
# CANONICAL=apex (default): www -> apex.  CANONICAL=www: apex -> www.
# Safe to re-run: it replaces the zone's single-redirect ruleset with the one rule below.
#
# Usage: CANONICAL=www CF_API_TOKEN=... scripts/cloudflare-canonical-host.sh [--dry-run]
# Token needs: Zone Read, Single Redirect Edit on the zones listed.
set -euo pipefail

: "${CF_API_TOKEN:?set CF_API_TOKEN}"
API=https://api.cloudflare.com/client/v4
DRY=${1:-}

CANONICAL=${CANONICAL:-apex}
DOMAINS=(imperialpedia.com lawelitenetwork.com)

cf() { curl -sS -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" "$@"; }

for domain in "${DOMAINS[@]}"; do
  zone=$(cf "$API/zones?name=$domain" | python3 -c "import sys,json;r=json.load(sys.stdin)['result'];print(r[0]['id'] if r else '')")
  [ -n "$zone" ] || { echo "$domain: zone not found" >&2; exit 1; }

  body=$(DOMAIN=$domain CANONICAL=$CANONICAL python3 - <<'EOF'
import json, os
d = os.environ["DOMAIN"]
www = os.environ["CANONICAL"] == "www"
src, dst = (d, "www." + d) if www else ("www." + d, d)
print(json.dumps({"rules": [{
    "description": f"{src} to {dst} (single 301)",
    "enabled": True,
    "expression": f'(http.host eq "{src}")',
    "action": "redirect",
    "action_parameters": {"from_value": {
        "status_code": 301,
        "preserve_query_string": True,
        "target_url": {"expression": f'concat("https://{dst}", http.request.uri.path)'},
    }},
}]}))
EOF
)
  if [ "$DRY" = "--dry-run" ]; then echo "$domain ($zone): $body"; continue; fi

  cf -X PUT "$API/zones/$zone/rulesets/phases/http_request_dynamic_redirect/entrypoint" --data "$body" |
    python3 -c "import sys,json;d=json.load(sys.stdin);print('$domain', 'ok' if d['success'] else d['errors'])"
done
