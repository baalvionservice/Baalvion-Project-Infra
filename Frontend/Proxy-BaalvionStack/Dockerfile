# Proxy-BaalvionStack (proxy.baalvionstack.com) — Vite React SPA static image
# (pnpm + Turborepo monorepo) served by non-root nginx.
#
# This is a workspace member depending on @baalvion/auth-sdk (workspace:*), so the build is a
# repo-root `turbo prune`. VITE_* are inlined at BUILD time — pass them as --build-arg and point
# them at the PUBLIC prod origins. The SPA needs a same-origin /auth-bff reverse-proxy in prod so
# the httpOnly refresh cookie flows; nginx handles that (target = AUTH_PROXY_TARGET runtime env).
#
# Build context = REPO ROOT:
#   docker build -f Frontend/Proxy-BaalvionStack/Dockerfile -t proxy-web \
#     --build-arg VITE_API_PLATFORM_BASE_URL=https://api.baalvion.com/api/v1/infrastructure/proxy/v1 \
#     --build-arg VITE_API_AUTH_BASE_URL=https://api.baalvion.com/api/v1/identity/auth/v1/auth \
#     --build-arg VITE_GATEWAY_URL=https://api.baalvion.com \
#     .
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune proxy-baalvionstack-web --docker

# 2) Install pruned deps (--no-frozen-lockfile: turbo prune may drop override snapshots).
FROM base AS installer
COPY .npmrc* ./
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# 3) Build the static SPA (VITE_* must be present here — Vite inlines them into the bundle).
ARG VITE_API_PLATFORM_BASE_URL
ARG VITE_API_AUTH_BASE_URL
ARG VITE_GATEWAY_URL
ARG VITE_BFF_MODE
ARG VITE_PROXY_GATEWAY_HOST
ARG VITE_PROXY_GATEWAY_HTTP_PORT
ARG VITE_PROXY_GATEWAY_SOCKS_PORT
ARG VITE_PAYU_ACTION_URL
ENV NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm dlx turbo@2.9.14 run build --filter=proxy-baalvionstack-web

# 4) Static runner — non-root nginx (uid 101), listens on 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
ENV AUTH_PROXY_TARGET=https://api.baalvion.com/api/v1/identity/auth/v1/auth
ENV AUTH_PROXY_HOST=api.baalvion.com
COPY --chown=nginx:nginx Frontend/Proxy-BaalvionStack/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=installer --chown=nginx:nginx /app/Frontend/Proxy-BaalvionStack/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["sh","-c","wget -qO- http://127.0.0.1:8080/healthz || exit 1"]
# Base image entrypoint runs envsubst on /etc/nginx/templates/*.template then starts nginx.
