# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/knowledge/cms-service/Dockerfile -t cms-service .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune cms-service --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
# turbo prune can emit a pruned lockfile that drops pnpm catalog-aliased entries
# (e.g. uuid@11). Reconcile in-image rather than hard-failing on the pruned lockfile.
RUN pnpm install --no-frozen-lockfile --filter cms-service...
COPY --from=pruner /repo/out/full/ ./
# Build the TS workspace deps (e.g. @baalvion/sdk -> dist) BEFORE deploy: dist is git- and
# docker-ignored, so it cannot be copied from the host — it must be compiled inside the image.
# The shared tsconfig chain (root base + Backend shim) is not part of the pruned output → copy it.
COPY tsconfig.base.json ./tsconfig.base.json
COPY Backend/tsconfig.base.json ./Backend/tsconfig.base.json
RUN pnpm dlx turbo@2.9.14 run build --filter=cms-service...
RUN pnpm deploy --filter=cms-service --prod /out

FROM node:20-alpine AS final
# Patch OS packages (e.g. openssl) and drop the runtime-unused npm/corepack shipped in the
# node base image (its bundled deps are the source of the image-layer CVE findings).
RUN apk upgrade --no-cache \
    && apk add --no-cache dumb-init \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3011
USER app
# cms-service serves its health route at /api/v1/health; a <500 on the root path
# is sufficient for a liveness probe.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3011),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
