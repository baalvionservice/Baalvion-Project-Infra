# Law Elite Network — frontend (Next.js 15) production image.
#
# law-elite-network-web is a pnpm workspace member (depends on @baalvion/eslint-config,
# @baalvion/company, @baalvion/design, @baalvion/illustrations via workspace:*), so a plain
# `npm install` cannot resolve it -- that protocol has no meaning outside a pnpm workspace,
# and this app was never actually buildable through the bare-npm form this Dockerfile used
# before. This image is monorepo-aware (turbo prune + pnpm), same pattern as
# Frontend/admin-platform/Dockerfile, and bakes the prod NEXT_PUBLIC_* into the client bundle.
#
# Build context = REPO ROOT:
#   docker build -f Frontend/Law-Elite-Network-main/Dockerfile -t law-elite-web \
#     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/v1 \
#     --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
#     .
FROM node:26-alpine AS base
RUN apk add --no-cache libc6-compat && npm install -g corepack && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune law-elite-network-web --docker

# 2) Install the pruned deps. --no-frozen-lockfile: turbo prune can drop catalog/override
#    snapshots from the pruned lockfile, which a frozen install rejects.
FROM base AS installer
COPY .npmrc* ./
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# 3) Build. NEXT_PUBLIC_* are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
# Shared tsconfig chain is not part of the pruned output → copy it for the TS build.
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm dlx turbo@2.9.14 run build --filter=law-elite-network-web

# 4) Minimal runner (Next standalone server).
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=9002 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app/Frontend/Law-Elite-Network-main
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Law-Elite-Network-main/.next/standalone /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Law-Elite-Network-main/.next/static ./.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Law-Elite-Network-main/public ./public
USER nextjs
EXPOSE 9002
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||9002),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
# WORKDIR is already the package path, so server.js is right here -- not
# Frontend/Law-Elite-Network-main/server.js again (that duplicated path doesn't
# exist and was never actually caught before because nothing had run this
# image; CI only builds and CVE-scans it, it never starts the container).
CMD ["node", "server.js"]
