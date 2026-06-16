# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/infrastructure/audit-service/Dockerfile -t audit-service .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune audit-service --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
# turbo prune drops the root uuid@11 override snapshot from the pruned lockfile, so a frozen
# install fails (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY); --no-frozen lets pnpm repair it in-image.
RUN pnpm install --no-frozen-lockfile --filter audit-service...
COPY --from=pruner /repo/out/full/ ./
RUN pnpm deploy --filter=audit-service --prod /out

FROM node:20-alpine AS final
RUN apk add --no-cache dumb-init \
    && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3032
USER app
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3032),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
