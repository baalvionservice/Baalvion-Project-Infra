# about.baalvion.com — Next 15 standalone image (pnpm + Turborepo monorepo).
# Build context = REPO ROOT:  docker build -f Frontend/about-baalvion-main/Dockerfile -t about-web .
#
# This app is CMS-driven and reads the CMS public delivery API server-side at runtime,
# so it needs no NEXT_PUBLIC_* baked in beyond the public app URL. CMS_PUBLIC_URL /
# CMS_WEBSITE_SLUG are read at request time (server components), passed as runtime env.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps
FROM base AS pruner
COPY . .
RUN npx turbo prune about-baalvion-web --docker

# 2) Install pruned deps.
# --no-frozen-lockfile: the root pins a version-selector pnpm override and `turbo prune`
# drops the matching package snapshot from the pruned lockfile, so a frozen install fails
# (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY). Non-frozen lets pnpm repair the gap in-image.
FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# 3) Build.
# about-web is CMS-driven and reads the CMS delivery API server-side at RUNTIME
# (CMS_PUBLIC_URL / CMS_WEBSITE_SLUG are plain runtime env, NOT baked). The only build-time
# value the client bundle needs is the public app URL.
ARG NEXT_PUBLIC_APP_URL
# CRITICAL: ARG alone is NOT visible to `next build`; re-export as ENV so it is inlined.
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
COPY --from=pruner /app/out/full/ ./
RUN pnpm turbo run build --filter=about-baalvion-web

# 4) Minimal runner (standalone server)
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3020 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/about-baalvion-main/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/about-baalvion-main/.next/static ./Frontend/about-baalvion-main/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/about-baalvion-main/public ./Frontend/about-baalvion-main/public
USER nextjs
EXPOSE 3020
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3020),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
# Standalone server entrypoint is nested under the app path in a monorepo build.
CMD ["node", "Frontend/about-baalvion-main/server.js"]
