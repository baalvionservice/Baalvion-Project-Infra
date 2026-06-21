# Environment Variable Matrix

**Date:** 2026-06-20
**Legend:** **B** = build-time (inlined into bundle — must be a Docker `--build-arg`); **R** = runtime (container env). `NEXT_PUBLIC_*` and `VITE_*` are ALWAYS build-time.

---

## Admin Platform (`baalvion-admin-platform`, port 3030)

| Variable | B/R | Required | Prod value / default |
|----------|:---:|:---:|----------------------|
| NEXT_PUBLIC_API_URL | B | rec | `https://api.baalvion.com/api/v1/infrastructure/proxy/v1` (default) |
| NEXT_PUBLIC_ADMIN_API_URL | B | rec | `https://api.baalvion.com/api/v1/platform/admin/v1` |
| NEXT_PUBLIC_SESSION_API_URL | B | rec | `https://api.baalvion.com/api/v1/identity/session/v1` |
| NEXT_PUBLIC_OAUTH_URL | B | rec | `https://api.baalvion.com/api/v1/identity/oauth` |
| NEXT_PUBLIC_AUTH_URL | B | rec | gateway auth base |
| NEXT_PUBLIC_CMS_API_URL | B | rec | `https://api.baalvion.com/api/v1/knowledge/cms/api/v1` |
| NEXT_PUBLIC_WS_URL | B | opt | `wss://api.baalvion.com/api/v1/infrastructure/realtime` |
| NEXT_PUBLIC_GATEWAY_URL | B | **yes** | `https://api.baalvion.com` (default is `http://localhost:3099` — override) |
| NEXT_PUBLIC_APP_URL / APP_ENV | B | rec | `https://admin.baalvion.com` / `production` |
| AUTH_PROXY_TARGET | R | yes | gateway auth path |
| `*_SERVICE_URL` (AUTH/ADMIN/SESSION/OAUTH/NOTIF/CTM) | R | opt | health-check targets; set if `/api/health-check` is used in prod |

## Amarisé (`amarise-maison-avenue-web`, port 3033)

| Variable | B/R | Required | Note |
|----------|:---:|:---:|------|
| NEXT_PUBLIC_COMMERCE_URL | B | **yes** | default `http://localhost:3012` — override |
| NEXT_PUBLIC_ORDER_URL / INVENTORY_URL | B | rec | default `https://api.baalvion.com/...` |
| NEXT_PUBLIC_STORE_ID | B | **yes** | **no default — errors if missing** |
| NEXT_PUBLIC_CMS_URL | B | **yes** | default `http://localhost:3011` — override |
| NEXT_PUBLIC_CMS_WEBSITE_SLUG | B | rec | `amarise-maison-avenue` |
| NEXT_PUBLIC_CRM_URL | B | opt | default `http://localhost:3063` |
| NEXT_PUBLIC_SITE_URL | B | rec | `https://www.amarisemaisonavenue.com` |
| NEXT_PUBLIC_MEDIA_HOST | B | rec | CDN/media host for image CSP + remotePatterns |
| AUTH_PROXY_TARGET | R | yes | gateway auth path |

## ControlTheMarket (`controlthemarket-web`, container port 3000)

| Variable | B/R | Required | Note |
|----------|:---:|:---:|------|
| NEXT_PUBLIC_CTM_API_URL | B | rec | default `https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1` |
| NEXT_PUBLIC_APP_URL | B | **yes** | required, no default |
| NEXT_PUBLIC_USE_MOCK | B | no | `false` in prod |
| AUTH_PROXY_TARGET | R | yes | gateway auth path |

## Law Elite (`law-elite-network-web`, port 9002)

| Variable | B/R | Required | Note |
|----------|:---:|:---:|------|
| NEXT_PUBLIC_API_BASE_URL | B | rec | default `https://api.baalvion.com/api/v1/knowledge/law/v1` |
| NEXT_PUBLIC_APP_URL | B | rec | `https://lawelitenetwork.com` |
| NEXT_PUBLIC_WS_URL | B | opt | derived from API base if unset |
| CMS_PUBLIC_URL | R | yes | default `http://localhost:3011/api/v1/public` — override |
| CMS_WEBSITE_SLUG | R | rec | `law-elite-network` |
| AUTH_SERVICE_URL | R | yes | `/api/auth` BFF target |
| AUTH_PROXY_TARGET | R | yes | gateway auth path |

## Imperialpedia (`imperialpedia-web`, port 3029)

| Variable | B/R | Required | Note |
|----------|:---:|:---:|------|
| NEXT_PUBLIC_API_URL | B | rec | default `https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1` |
| NEXT_PUBLIC_IMPERIALPEDIA_API_URL | B | **yes** | default `http://localhost:3004` — **override** |
| NEXT_PUBLIC_CMS_PUBLIC_URL | B | **yes** | default `http://localhost:3018` (inconsistent w/ `:3011`) — **override & reconcile** |
| NEXT_PUBLIC_CMS_SITE_SLUG | B | rec | `imperialpedia` |
| NEXT_PUBLIC_SITE_URL | B | rec | `https://imperialpedia.com` |
| NEXT_PUBLIC_ADMIN_PLATFORM_URL | B | rec | `https://admin.baalvion.com` |
| NEXT_PUBLIC_GA_ID / ADSENSE_CLIENT | B | opt | analytics (disabled if unset) |
| AUTH_PROXY_TARGET | R | yes | gateway auth path |
| REVALIDATE_SECRET / INDEXNOW_KEY | R | rec | ISR revalidation + IndexNow |
| GEMINI/GOOGLE GENAI keys | R | opt | server AI flows |

## GTI (`baalvion-eternal-absolute-singularity`, port 9003)

| Variable | B/R | Required | Note |
|----------|:---:|:---:|------|
| NEXT_PUBLIC_API_BASE_URL | B | **yes** | default `http://localhost:3025` — **override** |
| NEXT_PUBLIC_APP_URL | B | rec | `https://trade.baalvion.com` |
| NEXT_PUBLIC_TELEMETRY_INGEST | B | opt | telemetry disabled if unset |
| GATEWAY_PROXY_TARGET | R | yes | `/trade-bff/*` rewrite target (default `http://localhost:3099`) |
| GATEWAY_SIGNING_SECRET | R | **yes** | server rejects requests without it |
| DATABASE_URL | R | **yes** | Prisma (Postgres) |
| GOOGLE_GENAI_API_KEY | R | opt | server AI |

## Proxy BaalvionStack (`proxy-baalvionstack-web`, nginx port 8080)

| Variable | B/R | Required | Note |
|----------|:---:|:---:|------|
| VITE_API_PLATFORM_BASE_URL | B | **yes** | **empty string in prod if unset → checkout breaks** |
| VITE_API_AUTH_BASE_URL | B | rec | default gateway auth base |
| VITE_GATEWAY_URL | B | rec | `https://api.baalvion.com` |
| VITE_BFF_MODE | B | opt | `off` default |
| VITE_PROXY_GATEWAY_HOST / HTTP_PORT / SOCKS_PORT | B | rec | `gw.baalvion.net` / `10000` / `1080` |
| VITE_PAYU_ACTION_URL | B | rec | PayU hosted endpoint |
| AUTH_PROXY_TARGET (nginx) | R | yes | `/auth-bff` upstream (default `https://api.baalvion.com/api/v1/identity/auth/v1/auth`) |
| AUTH_PROXY_HOST (nginx) | R | yes | upstream Host header / SNI (default `api.baalvion.com`) |

---

## Global rules

1. **Every `NEXT_PUBLIC_*` / `VITE_*` is baked at build time.** Setting it as a container env var at runtime has **no effect** — it must be a `--build-arg`.
2. **Never bake secrets as `NEXT_PUBLIC_*`/`VITE_*`** — they end up in the public bundle. All secrets (`*_SECRET`, API keys, `DATABASE_URL`) are runtime-only (R) and injected from AWS Secrets Manager / SSM.
3. **localhost defaults are dev fallbacks.** The 4 apps flagged **yes** above (Imperialpedia ×2, GTI, Proxy, Amarisé STORE_ID/COMMERCE/CMS, CTM APP_URL) will ship broken if their build args are omitted — these are the hard requirements for the CI build matrix.
