# Global Trade Infrastructure (trade.baalvion.com) — Next 15 standalone image
# (pnpm + Turborepo monorepo, Prisma).
#
# GTI is a pnpm workspace member (no package-lock.json) depending on @baalvion/auth-sdk
# (workspace:*) plus Prisma. Its nested pnpm-workspace.yaml (apps/services/packages) is
# governed by the ROOT workspace when built from the repo root, so a repo-root `turbo prune`
# is the correct build path. NEXT_PUBLIC_* are inlined at BUILD time — pass as --build-arg.
#
# Build context = REPO ROOT:
#   docker build -f Frontend/Global-Trade-Infrastructure-main/Dockerfile -t gti-web \
#     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.baalvion.com/api/v1/commerce/trade/v1 \
#     --build-arg NEXT_PUBLIC_APP_URL=https://trade.baalvion.com \
#     .
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune baalvion-eternal-absolute-singularity --docker

# 2) Install pruned deps. --ignore-scripts skips GTI's `postinstall: prisma generate`,
#    which would fail here (the prisma schema lives in out/full, not out/json). Prisma is
#    generated in the build stage below (the build script runs `prisma generate && next build`).
#    --no-frozen-lockfile: turbo prune can drop catalog/override snapshots a frozen install rejects.
FROM base AS installer
COPY .npmrc* ./
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# 3) Build (NEXT_PUBLIC_* inlined here; `turbo run build` runs `prisma generate && next build`).
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_TELEMETRY_INGEST
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
# Shared tsconfig chain is not part of the pruned output → copy it for the TS build.
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm dlx turbo@2.9.14 run build --filter=baalvion-eternal-absolute-singularity

# 4) Minimal runner (Next standalone server). Prisma query engine (linux-musl) matches the
#    alpine builder/runner pair; the generated client is traced into the standalone bundle.
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=9003 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Global-Trade-Infrastructure-main/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Global-Trade-Infrastructure-main/.next/static ./Frontend/Global-Trade-Infrastructure-main/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Global-Trade-Infrastructure-main/public ./Frontend/Global-Trade-Infrastructure-main/public
# Prisma schema + migrations for any runtime `prisma migrate deploy` sidecar.
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Global-Trade-Infrastructure-main/prisma ./Frontend/Global-Trade-Infrastructure-main/prisma
USER nextjs
EXPOSE 9003
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||9003)+'/api/health',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
# Standalone server entrypoint is nested under the app path in a monorepo build.
CMD ["node", "Frontend/Global-Trade-Infrastructure-main/server.js"]
