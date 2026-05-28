# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/platform/dashboard-service/Dockerfile -t dashboard-service .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune dashboard-service --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --filter dashboard-service...
COPY --from=pruner /repo/out/full/ ./
RUN pnpm deploy --filter=dashboard-service --prod /out

FROM node:20-alpine AS final
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3009
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
