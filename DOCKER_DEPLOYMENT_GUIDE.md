# Docker Deployment Guide — Baalvion Frontends (AWS)

**Date:** 2026-06-20

All images are multi-stage, `node:20-alpine` (Proxy runner = `nginx-unprivileged:alpine`), non-root, with a `HEALTHCHECK`. Six Next apps emit `standalone` server bundles; Proxy emits a static SPA served by nginx.

> **Build context = the REPO ROOT** for every app except Law Elite (single-dir context). This is required so `turbo prune` can resolve `@baalvion/auth-sdk` (`workspace:*`) and the shared lockfile. Each repo-root Dockerfile ships a `Dockerfile.dockerignore` because the root `.dockerignore` excludes `Frontend/`.

---

## App → URL → image → port → health

| App | Production URL | Image tag | Container port | Health endpoint |
|-----|----------------|-----------|:---:|----------------|
| Admin Platform | `admin.baalvion.com` | `admin-web` | 3030 | `/` (HTTP < 500) |
| Amarisé | `amarisemaisonavenue.com` | `amarise-web` | 3033 | `/` |
| ControlTheMarket | `controlthemarket.com` | `ctm-web` | 3000 | `/` |
| Law Elite | `lawelitenetwork.com` | `law-elite-web` | 9002 | `/` |
| Imperialpedia | `imperialpedia.com` | `imperialpedia-web` | 3029 | `/` |
| GTI | `trade.baalvion.com` | `gti-web` | 9003 | `/api/health` |
| Proxy | `proxy.baalvionstack.com` | `proxy-web` | 8080 | `/healthz` |

---

## Build commands (run from repo root)

```bash
# Admin Platform
docker build -f Frontend/admin-platform/Dockerfile -t admin-web \
  --build-arg NEXT_PUBLIC_APP_URL=https://admin.baalvion.com \
  --build-arg NEXT_PUBLIC_GATEWAY_URL=https://api.baalvion.com \
  --build-arg NEXT_PUBLIC_CMS_API_URL=https://api.baalvion.com/api/v1/knowledge/cms/api/v1 \
  .

# Amarisé
docker build -f Frontend/AmariseMaisonAvenue-main/Dockerfile -t amarise-web \
  --build-arg NEXT_PUBLIC_COMMERCE_URL=https://api.baalvion.com/api/v1/commerce/commerce/v1 \
  --build-arg NEXT_PUBLIC_STORE_ID=<store-id> \
  --build-arg NEXT_PUBLIC_CMS_URL=https://api.baalvion.com/api/v1/knowledge/cms/api/v1 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://www.amarisemaisonavenue.com \
  --build-arg NEXT_PUBLIC_MEDIA_HOST=cdn.amarisemaisonavenue.com \
  .

# ControlTheMarket
docker build -f Frontend/controlthemarket-main/Dockerfile -t ctm-web \
  --build-arg NEXT_PUBLIC_CTM_API_URL=https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1 \
  --build-arg NEXT_PUBLIC_APP_URL=https://controlthemarket.com \
  .

# Law Elite (single-dir context — note the trailing path, NOT '.')
docker build -t law-elite-web \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.baalvion.com/api/v1/knowledge/law/v1 \
  --build-arg NEXT_PUBLIC_APP_URL=https://lawelitenetwork.com \
  Frontend/Law-Elite-Network-main

# Imperialpedia
docker build -f Frontend/Imperialpedia-main/Dockerfile -t imperialpedia-web \
  --build-arg NEXT_PUBLIC_IMPERIALPEDIA_API_URL=https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1 \
  --build-arg NEXT_PUBLIC_CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/knowledge/cms/api/v1/public \
  --build-arg NEXT_PUBLIC_SITE_URL=https://imperialpedia.com \
  .

# GTI (Prisma)
docker build -f Frontend/Global-Trade-Infrastructure-main/Dockerfile -t gti-web \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.baalvion.com/api/v1/commerce/trade/v1 \
  --build-arg NEXT_PUBLIC_APP_URL=https://trade.baalvion.com \
  .

# Proxy (Vite SPA → nginx)
docker build -f Frontend/Proxy-BaalvionStack/Dockerfile -t proxy-web \
  --build-arg VITE_API_PLATFORM_BASE_URL=https://api.baalvion.com/api/v1/infrastructure/proxy/v1 \
  --build-arg VITE_API_AUTH_BASE_URL=https://api.baalvion.com/api/v1/identity/auth/v1/auth \
  --build-arg VITE_GATEWAY_URL=https://api.baalvion.com \
  .
```

> Enable BuildKit (`DOCKER_BUILDKIT=1`) so the per-Dockerfile `Dockerfile.dockerignore` overrides take effect.

---

## Runtime env (injected at container start, NOT baked)

```bash
# Next apps that proxy auth (admin / amarisé / ctm / imperialpedia)
-e AUTH_PROXY_TARGET=https://api.baalvion.com/api/v1/identity/auth/v1/auth

# Law Elite
-e AUTH_SERVICE_URL=https://api.baalvion.com/api/v1/identity/auth/v1 \
-e CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/knowledge/cms/api/v1/public

# GTI
-e GATEWAY_PROXY_TARGET=https://api.baalvion.com \
-e GATEWAY_SIGNING_SECRET=<secret> \
-e DATABASE_URL=<postgres-url>

# Proxy (nginx auth-bff upstream)
-e AUTH_PROXY_TARGET=https://api.baalvion.com/api/v1/identity/auth/v1/auth \
-e AUTH_PROXY_HOST=api.baalvion.com
```

Pull secrets from **AWS Secrets Manager / SSM Parameter Store** via the ECS task definition `secrets:` block — never as plaintext `environment:`.

---

## AWS deployment shape (recommended)

- **ECS Fargate** service per image behind an **ALB**; target group health check = the table's health endpoint, `matcher: 200-399`.
- **ECR** repo per image; CI builds + pushes with the build args above (build args sourced from SSM, secrets injected at runtime only).
- **ACM** TLS cert per domain on the ALB HTTPS listener; HTTP→HTTPS redirect.
- **Route 53** A/ALIAS record per domain → ALB.
- Container `HEALTHCHECK` already defined; ECS uses the ALB health check as the authority.
- GTI additionally needs network reach to Postgres (RDS) and a one-time `prisma migrate deploy` (run as an ECS task using the `prisma/` dir baked into the image).

### Per-Dockerfile notes
- **Standalone server.js path is nested** in the monorepo builds (`Frontend/<app>/server.js`) — already handled in each `CMD`.
- **Proxy** runs as nginx uid 101 on 8080; if fronted directly by ALB, point the target group at 8080.
- **GTI** base image adds `openssl` for the Prisma query engine; builder & runner are both alpine so the `linux-musl` engine matches.
