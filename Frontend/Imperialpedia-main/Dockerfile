# Imperialpedia web — Next 15 standalone image (pnpm + Turborepo monorepo).
#
# imperialpedia-web is a pnpm workspace member (no package-lock.json) depending on
# @baalvion/auth-sdk (workspace:*), so a plain `npm ci` cannot build it. This image is
# monorepo-aware (turbo prune + pnpm). NEXT_PUBLIC_* are inlined at BUILD time — pass them
# as --build-arg and point them at the PUBLIC prod origins, NOT the localhost dev defaults.
#
# Build context = REPO ROOT:
#   docker build -f Frontend/Imperialpedia-main/Dockerfile -t imperialpedia-web \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1 \
#     --build-arg NEXT_PUBLIC_IMPERIALPEDIA_API_URL=https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1 \
#     --build-arg NEXT_PUBLIC_CMS_PUBLIC_URL=https://api.baalvion.com/api/v1/knowledge/cms/api/v1/public \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://imperialpedia.com \
#     .
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune imperialpedia-web --docker

# 2) Install pruned deps. --no-frozen-lockfile: turbo prune can drop catalog/override
#    snapshots from the pruned lockfile, which a frozen install rejects.
FROM base AS installer
COPY .npmrc* ./
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# 3) Build (NEXT_PUBLIC_* must be present here — they are inlined into the client bundle).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_IMPERIALPEDIA_API_URL
ARG NEXT_PUBLIC_CMS_PUBLIC_URL
ARG NEXT_PUBLIC_CMS_SITE_SLUG=imperialpedia
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_ADMIN_PLATFORM_URL
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_ADSENSE_CLIENT
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
# Shared tsconfig chain is not part of the pruned output → copy it for the TS build.
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm dlx turbo@2.9.14 run build --filter=imperialpedia-web

# 4) Minimal runner (Next standalone server).
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3029 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Imperialpedia-main/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Imperialpedia-main/.next/static ./Frontend/Imperialpedia-main/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/Imperialpedia-main/public ./Frontend/Imperialpedia-main/public
USER nextjs
EXPOSE 3029
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3029),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
# Standalone server entrypoint is nested under the app path in a monorepo build.
CMD ["node", "Frontend/Imperialpedia-main/server.js"]
