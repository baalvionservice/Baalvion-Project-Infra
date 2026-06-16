# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/identity/auth-gateway/Dockerfile -t auth-gateway .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune @baalvion/auth-gateway --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
# --no-frozen-lockfile: turbo prune drops the root's uuid@11 version-selector override snapshot
# from the pruned lockfile, so a frozen install fails (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY).
RUN pnpm install --no-frozen-lockfile --filter @baalvion/auth-gateway...
COPY --from=pruner /repo/out/full/ ./
RUN pnpm deploy --filter=@baalvion/auth-gateway --prod /out

FROM node:20-alpine AS final
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3099
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
