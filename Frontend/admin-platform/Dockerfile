# baalvion-admin-platform — Next 15 standalone image (pnpm + Turborepo monorepo).
#
# admin-platform is a pnpm workspace member (no package-lock.json) that depends on
# @baalvion/auth-sdk (workspace:*), so a plain `npm ci` cannot build it. This image is
# monorepo-aware (turbo prune + pnpm) and bakes the prod NEXT_PUBLIC_* into the client bundle.
#
# Build context = REPO ROOT:
#   docker build -f Frontend/admin-platform/Dockerfile -t admin-web \
#     --build-arg NEXT_PUBLIC_APP_URL=https://admin.baalvion.com \
#     --build-arg NEXT_PUBLIC_GATEWAY_URL=https://api.baalvion.com \
#     .
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune baalvion-admin-platform --docker

# 2) Install the pruned deps. --no-frozen-lockfile: turbo prune can drop catalog/override
#    snapshots (e.g. uuid@11) from the pruned lockfile, which a frozen install rejects.
FROM base AS installer
COPY .npmrc* ./
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# 3) Build. NEXT_PUBLIC_* are inlined into the client bundle + middleware at build time.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GATEWAY_URL
ARG NEXT_PUBLIC_CMS_API_URL
ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_APP_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
# Shared tsconfig chain is not part of the pruned output → copy it for the TS build.
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm dlx turbo@2.9.14 run build --filter=baalvion-admin-platform

# 4) Minimal runner (Next standalone server).
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3030 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app/Frontend/admin-platform
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/admin-platform/.next/standalone /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/admin-platform/.next/static ./.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/admin-platform/public ./public
USER nextjs
EXPOSE 3030
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3030),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
# Next standalone emits the workspace server.js under the package path.
CMD ["node", "Frontend/admin-platform/server.js"]
