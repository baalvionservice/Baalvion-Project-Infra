# ir.baalvion.com — Next standalone image for the Hostinger box (service app-ir-web).
#
# Build context = REPO ROOT (pnpm workspace; turbo prune needs the root lockfile):
#
#   docker build -f Frontend/ir.baalvion.com/Dockerfile -t baalvion-ir-web:local .
#
# NEXT_PUBLIC_* values are baked in at build time. Pass the same values the running image was
# built with if they differ from the production defaults in src/config.ts. Server-side URLs
# (IR_SERVICE_URL, MARKETPLACE_SERVICE_URL, CMS_PUBLIC_URL, IR_INVEST_INVITES, ...) are runtime
# variables and come from docker-compose, not from this file.
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat && npm install -g corepack && corepack enable
WORKDIR /app

# 1) Prune the monorepo down to this app and the workspace packages it uses.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune ir.baalvion.com --docker

# 2) Install the pruned dependency set.
FROM base AS installer
COPY .npmrc* ./
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# 3) Build.
ARG NEXT_PUBLIC_BASE_URL=https://ir.baalvion.com
ARG NEXT_PUBLIC_GA4_ID
ARG NEXT_PUBLIC_CLARITY_ID
ARG NEXT_PUBLIC_GSC_VERIFICATION
ARG NEXT_PUBLIC_BING_VERIFICATION
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production BUILD_STANDALONE=1 \
    NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} \
    NEXT_PUBLIC_GA4_ID=${NEXT_PUBLIC_GA4_ID} \
    NEXT_PUBLIC_CLARITY_ID=${NEXT_PUBLIC_CLARITY_ID} \
    NEXT_PUBLIC_GSC_VERIFICATION=${NEXT_PUBLIC_GSC_VERIFICATION} \
    NEXT_PUBLIC_BING_VERIFICATION=${NEXT_PUBLIC_BING_VERIFICATION}
COPY --from=pruner /app/out/full/ ./
COPY tsconfig.base.json ./tsconfig.base.json
# --env-mode=loose: turbo 2.x filters the task environment to what turbo.json declares, and
# BUILD_STANDALONE is not declared there. Filtered, `output: 'standalone'` silently does not
# apply and the runner stage fails on a missing .next/standalone several minutes later.
RUN pnpm dlx turbo@2.9.14 run build --filter=ir.baalvion.com --env-mode=loose

# 4) Minimal runner.
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3027 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/ir.baalvion.com/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/ir.baalvion.com/.next/static ./Frontend/ir.baalvion.com/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/ir.baalvion.com/public ./Frontend/ir.baalvion.com/public
USER nextjs
EXPOSE 3027
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3027),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "Frontend/ir.baalvion.com/server.js"]
