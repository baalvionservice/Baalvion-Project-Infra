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
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3011
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
