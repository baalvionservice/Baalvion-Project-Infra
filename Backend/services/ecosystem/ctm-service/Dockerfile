# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/ecosystem/ctm-service/Dockerfile -t ctm-service .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune baalvion-ctm-service --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
# NOTE: --no-frozen-lockfile (not --frozen) is required. The root package.json pins a version-selector
# pnpm override ("uuid@11": "11.1.1"); `turbo prune` keeps the override line but drops the matching
# uuid@11.1.1 package snapshot from the pruned lockfile, so a frozen install fails with
# ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY. Non-frozen lets pnpm repair the pruned-lockfile gap in-image.
# (The root lockfile itself is consistent — `pnpm install --frozen-lockfile` passes on the host.)
RUN pnpm install --no-frozen-lockfile --filter baalvion-ctm-service...
COPY --from=pruner /repo/out/full/ ./
RUN pnpm deploy --filter=baalvion-ctm-service --prod /out

FROM node:20-alpine AS final
# Patch OS packages (e.g. openssl) and drop the runtime-unused npm/corepack shipped in the
# node base image (its bundled deps are the source of the image-layer CVE findings).
RUN apk upgrade --no-cache \
    && apk add --no-cache dumb-init \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
ENV PORT=3017
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3017
USER app
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3017),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
