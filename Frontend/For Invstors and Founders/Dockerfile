# Static build of the Insiders directory SPA, served by nginx.
#
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f "Frontend/For Invstors and Founders/Dockerfile" -t baalvion-insiders-web:local .
#
# No NEXT_PUBLIC/VITE build args are passed on purpose. The app's two API bases both default
# to same-origin paths (/insiders-api, /auth-bff) which Caddy resolves to app-insiders on this
# box, so there is nothing to bake in — and nothing to get silently wrong the way a bare ARG
# does when it has no matching ENV.
FROM node:26.9-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.16 prune investors-and-founders-web --docker

FROM base AS builder
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
# turbo prune drops the root uuid@11 override snapshot from the pruned lockfile, so a frozen
# install fails (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY); --no-frozen lets pnpm repair it here.
RUN pnpm install --no-frozen-lockfile --filter investors-and-founders-web...
COPY --from=pruner /repo/out/full/ ./
RUN pnpm --filter investors-and-founders-web build

FROM nginx:1.27-alpine AS final
# SPA fallback: every directory route is client-rendered, so an unmatched path must return
# index.html rather than nginx's 404. Assets keep a long immutable cache (Vite content-hashes
# their filenames); index.html must not, or a deploy would not be picked up.
RUN printf '%s\n' \
  'server {' \
  '  listen 8080;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; try_files $uri =404; }' \
  '  location = /index.html { add_header Cache-Control "no-cache"; }' \
  '  location / { try_files $uri $uri/ /index.html; }' \
  '}' > /etc/nginx/conf.d/default.conf \
  && rm -rf /usr/share/nginx/html/*
# JSON-array form is required: the source path contains spaces, and the shell form treats
# them as argument separators no matter how they are quoted.
COPY --from=builder ["/repo/Frontend/For Invstors and Founders/dist", "/usr/share/nginx/html"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/index.html >/dev/null 2>&1 || exit 1
