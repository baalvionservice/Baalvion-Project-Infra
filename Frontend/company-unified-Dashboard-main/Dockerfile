# company-unified-dashboard web — Next 15 standalone image (pnpm + Turborepo monorepo).
# Build context = REPO ROOT:
#   docker build -f Frontend/company-unified-Dashboard-main/Dockerfile -t dashboard-web .
#
# NEXT_PUBLIC_* that the CLIENT bundle reads are baked at BUILD time — pass them as --build-arg
# (see ARGs below), pointed at the PUBLIC prod origin. The /auth-bff + /api-bff rewrite target
# (NEXT_PUBLIC_GATEWAY_URL) is read by next.config at SERVER START, so it stays a RUNTIME env
# (set it to the internal gateway, e.g. http://auth-gateway:3099, in docker-compose).
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps (@baalvion/auth-sdk).
FROM base AS pruner
COPY . .
RUN npx turbo prune company-unified-dashboard-web --docker

# 2) Install pruned deps.
# --no-frozen-lockfile (not --frozen): the root pins a version-selector pnpm override
# ("uuid@11": "11.1.1") and `turbo prune` drops the matching package snapshot from the pruned
# lockfile, so a frozen install fails (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY). Non-frozen lets pnpm
# repair the gap in-image. The root lockfile itself is consistent (frozen install passes on the host).
FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# 3) Build (NEXT_PUBLIC_* are inlined into the client bundle + middleware at build time).
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_REALTIME_WS_URL
# Must equal the gateway's COOKIE_REFRESH_NAME, else the route-gate middleware 307-loops to /login.
ARG NEXT_PUBLIC_REFRESH_COOKIE_NAME=baalvion_refresh
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
RUN pnpm turbo run build --filter=company-unified-dashboard-web

# 4) Minimal runner (standalone server).
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3024 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/company-unified-Dashboard-main/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/company-unified-Dashboard-main/.next/static ./Frontend/company-unified-Dashboard-main/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/company-unified-Dashboard-main/public ./Frontend/company-unified-Dashboard-main/public
USER nextjs
EXPOSE 3024
# Standalone server entrypoint is nested under the app path in a monorepo build.
CMD ["node", "Frontend/company-unified-Dashboard-main/server.js"]
