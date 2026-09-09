# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/ecosystem/insiders-service/Dockerfile -t insiders-service .
FROM node:20.12-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune insiders-service --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
# turbo prune drops the root uuid@11 override snapshot from the pruned lockfile, so a frozen
# install fails (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY); --no-frozen lets pnpm repair it in-image.
RUN pnpm install --no-frozen-lockfile --filter insiders-service...
COPY --from=pruner /repo/out/full/ ./
# turbo prune does not carry the root tsconfig.base.json, and every package's tsconfig
# extends it. Without this the tsup DTS build fails with "Cannot find base config file"
# and the whole recursive build exits 1. Dockerfile.node and the CanWeMarry image both
# copy it for the same reason.
COPY tsconfig.base.json ./tsconfig.base.json
# Build the workspace packages BEFORE pnpm deploy. @baalvion/money and @baalvion/sites are
# TypeScript whose package.json "exports" points at dist/, which only exists after tsup runs.
# Without this the install succeeds, `pnpm deploy` copies the package with no dist/, and the
# container dies at require() time — MODULE_NOT_FOUND on @baalvion/money/dist/index.js — with
# a health check that just reports "unhealthy" and no hint that a build step is missing.
# deploy/consolidated/Dockerfile.node already does this; this image did not, which is how the
# gap survived: every service inside the app-* bundles was fine, only the standalone ones broke.
RUN pnpm -r --filter "./Backend/packages/*" run build
RUN pnpm deploy --filter=insiders-service --prod /out

FROM node:20.12-alpine AS final
RUN apk add --no-cache dumb-init \
    && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
# index.js mkdirSync's the upload root at boot. /app is root-owned and the image drops to
# USER app below, so create it and hand it over first or the service EACCESes on every start.
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads
EXPOSE 3050
USER app
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3050),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
