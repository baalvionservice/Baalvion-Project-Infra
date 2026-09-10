# CanWeMarry (canwemarry.baalvion.com) — Next 15 standalone image.
#
# Build context = REPO ROOT, because this is a pnpm workspace member and turbo prune has to
# see the root lockfile:
#
#   docker build -f Frontend/CanWeMarry-main/Dockerfile -t baalvion-canwemarry-web:local \
#     --build-arg SITE_URL=https://canwemarry.baalvion.com .
#
# SITE_URL is a BUILD arg, not a runtime one, and that is deliberate. Guide pages are
# prerendered, so their canonical URL, Open Graph URL and JSON-LD are written into the HTML
# here. next.config.ts refuses a production build without it rather than silently publishing
# a site whose every canonical points at localhost.
#
# GATEWAY_ORIGIN is the opposite: server-side only, read per request, so it stays a runtime
# variable and points at the gateway over the docker network — no TLS handshake, no trip out
# to the public internet and back.
FROM node:26-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo down to this app and the workspace packages it actually uses.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune canwemarry-web --docker

# 2) Install the pruned dependency set.
#    --no-frozen-lockfile: turbo prune can drop catalog/override snapshots that a frozen
#    install then rejects. The lockfile is still the input; only the strictness relaxes.
FROM base AS installer
COPY .npmrc* ./
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# 3) Build.
ARG SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production BUILD_STANDALONE=1
ENV SITE_URL=${SITE_URL} NEXT_PUBLIC_SITE_URL=${SITE_URL}
COPY --from=pruner /app/out/full/ ./
COPY tsconfig.base.json ./tsconfig.base.json
# --env-mode=loose: turbo 2.x filters the task environment to what turbo.json declares, and
# BUILD_STANDALONE is not declared there. Strictly filtered, it never reaches next.config.ts,
# `output: 'standalone'` silently does not apply, and the build succeeds while producing no
# .next/standalone at all — the runner stage then fails on a missing COPY, several minutes
# later, with an error that says nothing about environment. Loose mode is scoped to this
# build; it changes no shared turbo config.
#
# NEXT_PUBLIC_* is exempt from that filtering, which is why the SITE_URL guard passed while
# BUILD_STANDALONE was being dropped.
RUN pnpm dlx turbo@2.9.14 run build --filter=canwemarry-web --env-mode=loose

# 4) Minimal runner.
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3071 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/CanWeMarry-main/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/CanWeMarry-main/.next/static ./Frontend/CanWeMarry-main/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/CanWeMarry-main/public ./Frontend/CanWeMarry-main/public
USER nextjs
EXPOSE 3071
# The app has no /api/health route, so the healthcheck asks for the home page. <500 is the
# right bar: it proves the server renders, and does not fail the container on a 404.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3071)+'/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "Frontend/CanWeMarry-main/server.js"]
