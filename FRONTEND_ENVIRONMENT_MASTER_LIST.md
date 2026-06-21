# FRONTEND ENVIRONMENT MASTER LIST

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only — retained as the per-app env-var dictionary. Deployment authority
> (architecture, stack scope, domains) is MASTER: in the shipped stacks Amarisé is
> **`shop.baalvion.com`** and the proxy platform is **`proxy.baalvionstack.com`**. Where this
> file disagrees with MASTER, **MASTER wins.**

> Every environment variable referenced across the 7 Baalvion frontends.
> Generated 2026-06-20. Audit only — no values were changed.
>
> **Build-time** = `NEXT_PUBLIC_*` / `VITE_*`, inlined into the bundle at `docker build`; must be passed as `--build-arg`. Cannot be changed at runtime.
> **Runtime** = read by the Node server (SSR) or nginx (`envsubst`) at container start; supplied via ECS task def / Secrets Manager.
> "Prod value" examples assume the canonical `https://api.baalvion.com/...` gateway; substitute per environment.

## 1. admin-platform (`admin.baalvion.com`)

| Variable | Build/Runtime | Required | Production value (example) | Source |
|----------|---------------|----------|----------------------------|--------|
| `NEXT_PUBLIC_API_URL` | Build | Yes | `https://api.baalvion.com/api/v1/infrastructure/proxy/v1` | src/lib/api/client.ts:8 |
| `NEXT_PUBLIC_AUTH_URL` | Build | Yes | `https://api.baalvion.com/api/v1/identity/auth/v1/auth` | src/lib/auth/sdk-session.ts:21 |
| `NEXT_PUBLIC_ADMIN_API_URL` | Build | Yes | `https://api.baalvion.com/api/v1/platform/admin/v1` | src/lib/api/client.ts:12 |
| `NEXT_PUBLIC_SESSION_API_URL` | Build | Yes | `https://api.baalvion.com/api/v1/identity/session/v1` | src/lib/api/client.ts:13 |
| `NEXT_PUBLIC_OAUTH_URL` | Build | Yes | `https://api.baalvion.com/api/v1/identity/oauth` | src/lib/api/client.ts:14 |
| `NEXT_PUBLIC_CMS_API_URL` | Build | Yes | `https://api.baalvion.com/api/v1/knowledge/cms/api/v1` | src/lib/api/client.ts:16 |
| `NEXT_PUBLIC_GATEWAY_URL` | Build | Yes | `https://api.baalvion.com` | src/lib/auth/gateway-client.ts:15 (⚠ falls back `localhost:3099`) |
| `NEXT_PUBLIC_APP_URL` | Build | Yes | `https://admin.baalvion.com` | .env.production.example:15 |
| `NEXT_PUBLIC_APP_ENV` | Build | Opt (dflt `development`) | `production` | next.config.ts:6 |
| `NEXT_PUBLIC_SERVICE_URLS` | Build | Opt (recommended) | JSON map of 18 service base URLs | src/lib/api/client.ts:168 |
| `NEXT_PUBLIC_SERVICES_HOST` | Build | Opt | (unset in prod; dflt `http://localhost`) | src/lib/api/client.ts:172 |
| `NEXT_PUBLIC_WS_URL` | Build | Opt | `wss://api.baalvion.com/api/v1/infrastructure/realtime` | src/lib/websocket/wsClient.ts:5 |
| `NEXT_PUBLIC_BFF_MODE` | Build | Opt | `on` (to use auth-gateway BFF) | src/lib/auth/sdk-session.ts:45 |
| `NEXT_PUBLIC_REFRESH_COOKIE_NAME` | Build | Opt | `baalvion_refresh` | src/middleware.ts:22 |
| `NEXT_PUBLIC_APP_NAME` | Build | Opt | `Baalvion Admin` | .env.example:7 |
| `NEXT_PUBLIC_ACCESS_TOKEN_TTL` | Build | Opt | `900000` | .env.example:11 |
| `NEXT_PUBLIC_CRM_API_URL` | Build | Opt | `https://api.baalvion.com/api/v1/ecosystem/crm/api/v1` | .env.production.example:44 |
| `AUTH_PROXY_TARGET` | Runtime | Opt | `https://api.baalvion.com/api/v1/identity/auth/v1/auth` | next.config.ts:61 |
| `ALLOW_LOCAL_BACKENDS` | Build (CSP) | Opt | unset | next.config.ts:25 |
| `AUTH_SERVICE_URL` | Runtime (health) | Yes* | `https://api.baalvion.com/.../auth` | src/app/api/health-check/route.ts:10 (⚠ dflt `localhost:3001`) |
| `ADMIN_SERVICE_URL` | Runtime (health) | Yes* | service URL | route.ts:11 (dflt `localhost:3021`) |
| `SESSION_SERVICE_URL` | Runtime (health) | Yes* | service URL | route.ts:12 (dflt `localhost:3022`) |
| `OAUTH_SERVICE_URL` | Runtime (health) | Yes* | service URL | route.ts:13 (dflt `localhost:3023`) |
| `NOTIF_SERVICE_URL` | Runtime (health) | Yes* | service URL | route.ts:14 (dflt `localhost:3031`) |
| `CTM_SERVICE_URL` | Runtime (health) | Yes* | service URL | route.ts:15 (dflt `localhost:3017`) |
| `NODE_ENV` / `PORT` / `HOSTNAME` / `NEXT_TELEMETRY_DISABLED` | Runtime | Set by Dockerfile | `production` / `3030` / `0.0.0.0` / `1` | Dockerfile |

\* The 6 `*_SERVICE_URL` health vars are **absent from the .env examples** — must be added to deployment config or the `/api/health-check` route reports those backends down.

## 2. AmariseMaisonAvenue-main (`amarisemaisonavenue.com`)

| Variable | Build/Runtime | Required | Production value (example) | Source |
|----------|---------------|----------|----------------------------|--------|
| `NEXT_PUBLIC_COMMERCE_URL` | Build | Yes | `https://api.baalvion.com/api/v1/commerce` | lib/api-client.ts:42 (⚠ dflt `localhost:3012`) |
| `NEXT_PUBLIC_COMMERCE_API_URL` | Build | Opt | (falls back to COMMERCE_URL) | lib/api-client.ts:41 |
| `NEXT_PUBLIC_ORDER_URL` | Build | Yes | `https://api.baalvion.com/api/v1/order` | lib/api-client.ts:44 |
| `NEXT_PUBLIC_INVENTORY_URL` | Build | Yes | `https://api.baalvion.com/api/v1/inventory` | lib/api-client.ts:45 |
| `NEXT_PUBLIC_CMS_URL` | Build | Yes | `https://api.baalvion.com/api/v1/knowledge/cms/api/v1` | lib/cms.ts:20 (⚠ dflt `localhost:3011`) |
| `NEXT_PUBLIC_CMS_WEBSITE_SLUG` | Build | Opt | `amarise-maison-avenue` | lib/cms.ts:21 |
| `NEXT_PUBLIC_STORE_ID` | Build | Yes (or JWT/domain) | store UUID | lib/store-id.ts:13 |
| `NEXT_PUBLIC_STORE_DOMAINS` | Build | Opt | `{"subdomain":"storeId"}` | lib/store-id.ts:19 |
| `NEXT_PUBLIC_APP_URL` | Build | Yes | `https://amarisemaisonavenue.com` | middleware.ts:31 (⚠ dflt `localhost:3036`) |
| `NEXT_PUBLIC_SITE_URL` | Build | Yes | `https://www.amarisemaisonavenue.com` | lib/seo.ts:18 |
| `NEXT_PUBLIC_MEDIA_HOST` | Build | Opt | S3/CloudFront host | next.config.ts:6 |
| `NEXT_PUBLIC_CRM_URL` | Build | Opt | `https://api.baalvion.com/api/v1/ecosystem/crm/api/v1` | lib/crm-client.ts:20 |
| `NEXT_PUBLIC_GATEWAY_URL` | Build | Opt | `/auth-bff` | lib/auth/gateway-session.ts:15 |
| `NEXT_PUBLIC_BFF_MODE` | Build | Opt | `on` | lib/auth/gateway-session.ts:12 |
| `NEXT_PUBLIC_ADMIN_CONSOLE_URL` | Build | Opt | central admin URL | middleware.ts:31 |
| `NEXT_PUBLIC_ENABLE_LIVE_SHOP` | Build | Opt | `true`/`false` | components/layout/MadAveLiveWidget.tsx:18 |
| `NEXT_PUBLIC_CHECKOUT_MODE` | Build | Opt | `CONTINUITY` | lib/checkout-policy.ts:21 |
| `NEXT_PUBLIC_REFRESH_COOKIE_NAME` | Build | Opt | `baalvion_refresh` | middleware.ts:20 |
| `AUTH_PROXY_TARGET` | Runtime | Opt | `https://api.baalvion.com/.../auth` | next.config.ts:85 |
| `NODE_ENV` / `PORT` / `HOSTNAME` | Runtime | Set by Dockerfile | `production` / `3033` / `0.0.0.0` | Dockerfile |

## 3. controlthemarket-main (`controlthemarket.com`)

| Variable | Build/Runtime | Required | Production value (example) | Source |
|----------|---------------|----------|----------------------------|--------|
| `NEXT_PUBLIC_CTM_API_URL` | Build | Yes | `https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1` | src/lib/api.ts:10 |
| `NEXT_PUBLIC_APP_URL` | Build | Yes | `https://controlthemarket.com` | src/lib/site-url.ts:14 |
| `NEXT_PUBLIC_USE_MOCK` | Build | Yes | `false` (hard-fails in prod if `true`) | src/lib/api.ts:8, auth-context.tsx:24 |
| `NEXT_PUBLIC_BFF_MODE` | Build | Opt | `on` if gateway auth | gateway-session.ts:12 |
| `NEXT_PUBLIC_GATEWAY_URL` | Build | Opt | `/auth-bff` | gateway-session.ts:15 |
| `NEXT_PUBLIC_REFRESH_COOKIE_NAME` | Runtime | Opt | `baalvion_refresh` | src/middleware.ts:12 |
| `AUTH_PROXY_TARGET` | Runtime | Yes | `https://api.baalvion.com/.../auth` | next.config.ts:60 |
| `NODE_ENV` / `PORT` / `HOSTNAME` / `NEXT_TELEMETRY_DISABLED` | Runtime | Set by Dockerfile | `production` / `3000` / `0.0.0.0` / `1` | Dockerfile |

## 4. Law-Elite-Network-main (`lawelite.network`)

| Variable | Build/Runtime | Required | Production value (example) | Source |
|----------|---------------|----------|----------------------------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | Build | Yes | `https://<law-api-host>/v1` | next.config.ts:13 / src/lib/api/client.ts:3 (⚠ wrong fallback domain — see notes) |
| `NEXT_PUBLIC_APP_URL` | Build | Yes | `https://lawelite.network` | src/app/layout.tsx:3 (dflt `https://lawelitenetwork.com`) |
| `AUTH_SERVICE_URL` | Runtime | Yes | auth-service URL | src/app/api/auth/_proxy.ts:5 (⚠ dflt `localhost:3001`) |
| `CMS_PUBLIC_URL` | Runtime | Yes | `https://<cms>/api/v1/public` | src/lib/cms.ts:13 (⚠ dflt `localhost:3011`) |
| `CMS_WEBSITE_SLUG` | Runtime | Opt | `law-elite-network` | src/lib/cms.ts:14 |
| `NEXT_PUBLIC_ADMIN_CONSOLE_URL` | Build | Opt | central admin URL (empty→`/admin` 404) | src/middleware.ts:10 |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` / `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` | Build | Opt | Algolia creds | .env.local:17 |
| `GOOGLE_GENAI_API_KEY` | Runtime | Opt | Gemini key (if AI flows used) | src/ai/genkit.ts |
| `NODE_ENV` / `PORT` | Runtime | Set by Dockerfile | `production` / `9002` | Dockerfile |

**Note:** `src/lib/api/client.ts:3` falls back to `https://api.baalvion.com/api/v1/knowledge/law/v1` when `NEXT_PUBLIC_API_BASE_URL` is unset — a **wrong-domain fallback** that masks a missing build arg. Treat the build arg as mandatory; fix the fallback to empty string + error.

## 5. Imperialpedia-main (`imperialpedia.com`)

| Variable | Build/Runtime | Required | Production value (example) | Source |
|----------|---------------|----------|----------------------------|--------|
| `NEXT_PUBLIC_API_URL` | Build | Yes | `https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1` | src/services/api-client/client.ts:5 |
| `NEXT_PUBLIC_IMPERIALPEDIA_API_URL` | Build | Yes | (same as above) | src/lib/data/loaders.ts:26 |
| `NEXT_PUBLIC_CMS_PUBLIC_URL` | Build | Yes | `https://api.baalvion.com/api/v1/knowledge/cms/api/v1/public` | src/services/data/cms-public.ts:21 |
| `NEXT_PUBLIC_SITE_URL` | Build | Yes | `https://imperialpedia.com` | src/config/env.ts:7 |
| `NEXT_PUBLIC_API_BASE_URL` | Build | Opt | (fallback) | next.config.ts:34 |
| `NEXT_PUBLIC_CMS_SITE_SLUG` | Build | Opt | `imperialpedia` | cms-public.ts:22 |
| `NEXT_PUBLIC_ADMIN_PLATFORM_URL` / `NEXT_PUBLIC_ADMIN_CONSOLE_URL` | Build | Opt | central admin URL | src/middleware.ts:24 (dflt `localhost:3030`) |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_ADSENSE_CLIENT` | Build | Opt | analytics IDs | components/common/Analytics.tsx:16 |
| `NEXT_PUBLIC_APP_NAME` / `*_EMAIL` / `*_STALE_TIME` etc. | Build | Opt | branding/tuning | src/config/env.ts, query-client.ts |
| `NEXT_PUBLIC_BFF_MODE` / `NEXT_PUBLIC_GATEWAY_URL` / `NEXT_PUBLIC_REFRESH_COOKIE_NAME` | Build | Opt | auth config | gateway-session.ts, middleware.ts:14 |
| `NEXT_PUBLIC_AUTH_URL` | Build | Opt | `https://api.baalvion.com/.../auth` | .env.local:4 |
| `AUTH_PROXY_TARGET` | Runtime | Opt | `https://api.baalvion.com/.../auth` | next.config.ts:41 |
| `REVALIDATE_SECRET` | Runtime | **Yes** | production secret | src/app/api/revalidate/route.ts:22 |
| `INDEXNOW_KEY` | Runtime | Opt | IndexNow key | revalidate/route.ts:47 |
| `GEMINI_API_KEY` / `GOOGLE_GENAI_API_KEY` / `GOOGLE_API_KEY` | Runtime | Opt | AI flow keys | src/ai/run-flow.ts:25 |
| `NODE_ENV` / `PORT` / `HOSTNAME` | Runtime | Set by Dockerfile | `production` / `3029` / `0.0.0.0` | Dockerfile |

## 6. Global-Trade-Infrastructure-main (`trade.baalvion.com`)

| Variable | Build/Runtime | Required | Production value (example) | Source |
|----------|---------------|----------|----------------------------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | Build | Yes | `https://api.baalvion.com/api/v1/commerce/trade/v1` | next.config.ts:4 (⚠ dflt `localhost:3025`) |
| `NEXT_PUBLIC_APP_URL` | Build | Yes | `https://trade.baalvion.com` | next.config.ts:3 |
| `NEXT_PUBLIC_TELEMETRY_INGEST` | Build | Opt | `1` | Dockerfile ARG:36 |
| `NEXT_PUBLIC_BFF_MODE` | Build | Opt | `on` (prod auth) | src/services/identity/gateway-session.ts:16 |
| `NEXT_PUBLIC_GATEWAY_URL` | Build | Opt | `/auth-bff` | gateway-session.ts:19 |
| `NEXT_PUBLIC_REFRESH_COOKIE_NAME` | Build | Opt | `baalvion_refresh` | src/middleware.ts:15 |
| `DATABASE_URL` | Runtime | **Yes (secret)** | `postgresql://<user>:<pw>@<host>:5432/gti_orchestration?schema=public&sslmode=require` | src/server/db/prisma.ts:19 (⚠ committed `.env` dflt = localhost `gti:gti`) |
| `GATEWAY_SIGNING_SECRET` | Runtime | **Yes (secret, ≥32)** | vault secret | src/server/http/identity.ts:49 |
| `GATEWAY_PROXY_TARGET` | Runtime | **Yes** | auth-gateway internal URL | next.config.ts:81 (⚠ dflt `localhost:3099`) |
| `SANCTIONS_API_URL` | Runtime | Opt | `https://api.baalvion.com/api/v1/sanctions` | api/sanctions/screen/route.ts:16 (dflt localhost) |
| `SANCTIONS_TIMEOUT_MS` | Runtime | Opt | `20000` | route.ts:17 |
| `GLOBAL_TRADE_API_URL` | Runtime | Opt | `https://api.baalvion.com/api/v1/commerce/trade/v1` | src/lib/api-proxy.ts:6 |
| `GOOGLE_GENAI_API_KEY` | Runtime | Opt | Gemini key (AI features) | src/ai/genkit.ts:17 |
| `NODE_ENV` / `PORT` / `HOSTNAME` | Runtime | Set by Dockerfile | `production` / `9003` / `0.0.0.0` | Dockerfile |

## 7. Proxy-BaalvionStack (`proxy.baalvion.com`) — Vite SPA

| Variable | Build/Runtime | Required | Production value (example) | Source |
|----------|---------------|----------|----------------------------|--------|
| `VITE_API_PLATFORM_BASE_URL` | **Build (baked)** | Yes | `https://api.baalvion.com/api/v1/infrastructure/proxy/v1` | platformClient.ts:3 |
| `VITE_API_AUTH_BASE_URL` | **Build (baked)** | Yes | `https://api.baalvion.com/api/v1/identity/auth/v1/auth` | vite.config.ts:18 |
| `VITE_GATEWAY_URL` | **Build (baked)** | Opt | `https://api.baalvion.com` | gateway-session.ts:15 |
| `VITE_BFF_MODE` | **Build (baked)** | Opt | `on` | gateway-session.ts:12 |
| `VITE_PROXY_GATEWAY_HOST` | **Build (baked)** | Opt | `gw.baalvion.net` | platformClient.ts:324 |
| `VITE_PROXY_GATEWAY_HTTP_PORT` | **Build (baked)** | Opt | `10000` | platformClient.ts:325 |
| `VITE_PROXY_GATEWAY_SOCKS_PORT` | **Build (baked)** | Opt | `1080` | platformClient.ts:326 |
| `VITE_PAYU_ACTION_URL` | **Build (baked)** | Opt | `https://secure.payu.in/_payment` | gatewayCheckout.ts:146 |
| `VITE_APP_URL` | **Build (baked)** | Opt | `https://proxy.baalvion.com` | .env.example:11 |
| `AUTH_PROXY_TARGET` | **Runtime (nginx envsubst)** | Yes | `https://api.baalvion.com/.../auth` | nginx.conf.template:24 (Dockerfile dflt = prod) |
| `AUTH_PROXY_HOST` | **Runtime (nginx envsubst)** | Yes | `api.baalvion.com` | Dockerfile:48 |

## 8. Fleet-wide rules
1. **Never rely on a build-arg's localhost/api.baalvion.com fallback** — pass every required `NEXT_PUBLIC_*`/`VITE_*` explicitly in the CI build command. Missing build args silently bake a wrong URL into the bundle.
2. **Secrets are runtime only** (`DATABASE_URL`, `GATEWAY_SIGNING_SECRET`, `REVALIDATE_SECRET`, AI keys) → AWS Secrets Manager / SSM, injected into the ECS task. Never bake secrets as build args (they'd land in image layers).
3. **`NODE_ENV=production`, `PORT`, `HOSTNAME=0.0.0.0`** are already set in every Next.js Dockerfile runner stage.
4. **Health-probe env (admin-platform's 6 `*_SERVICE_URL`)** is undocumented in `.env` examples — add to the task definition.
