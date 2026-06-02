# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/commerce/payment-service/Dockerfile -t payment-service .
# payment-service depends on the workspace packages @baalvion/sdk + @baalvion/auth-node
# (previously linked via a dev node_modules junction — not reproducible in Docker), so it
# must build through the monorepo pruner/installer like the other services.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
# payment-service's package name is scoped (@baalvion/payment-service), unlike the
# bare-named siblings — turbo/pnpm filters must use the scoped name.
RUN pnpm dlx turbo@2.9.14 prune @baalvion/payment-service --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --filter @baalvion/payment-service...
COPY --from=pruner /repo/out/full/ ./
# Build the TS workspace deps (e.g. @baalvion/sdk -> dist) BEFORE deploy: dist is git- and
# docker-ignored, so it cannot be copied from the host — it must be compiled inside the image.
# The shared tsconfig chain (root base + Backend shim) is not part of the pruned output → copy it.
COPY tsconfig.base.json ./tsconfig.base.json
COPY Backend/tsconfig.base.json ./Backend/tsconfig.base.json
RUN pnpm dlx turbo@2.9.14 run build --filter=@baalvion/payment-service...
RUN pnpm deploy --filter=@baalvion/payment-service --prod /out

FROM node:20-alpine AS final
RUN apk add --no-cache dumb-init wget
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3015
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:3015/health || exit 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
