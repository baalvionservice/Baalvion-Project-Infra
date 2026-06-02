# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT (set in docker-compose.yml: context: .):
#   docker build -f Backend/services/commerce/ledger-service/Dockerfile -t ledger-service .
# The previous Dockerfile ran `npm ci` against a service-dir context with no package-lock.json
# (this is a pnpm workspace) — it could never build. ledger-service has no @baalvion/* workspace
# deps, so no TS build step is needed; it still prunes through turbo for a reproducible install.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
# package name is scoped (@baalvion/ledger-service) — turbo/pnpm filters must use the scoped name.
RUN pnpm dlx turbo@2.9.14 prune @baalvion/ledger-service --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --filter @baalvion/ledger-service...
COPY --from=pruner /repo/out/full/ ./
RUN pnpm deploy --filter=@baalvion/ledger-service --prod /out

FROM node:20-alpine AS final
RUN apk add --no-cache dumb-init wget
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3014
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:3014/health || exit 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
