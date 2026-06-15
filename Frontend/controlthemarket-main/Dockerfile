# ControlTheMarket web — Next 15 standalone image (pnpm + Turborepo monorepo).
# Build context = REPO ROOT:
#   docker build -f Frontend/controlthemarket-main/Dockerfile -t ctm-web .
#
# NEXT_PUBLIC_* are baked at BUILD time — pass them as --build-arg (see ARGs below),
# NOT as runtime env. Point them at the PUBLIC prod origin. The /auth-bff/* rewrite target
# (AUTH_PROXY_TARGET) is read from next.config at server start, so it stays a RUNTIME env.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps (@baalvion/auth-sdk).
FROM base AS pruner
COPY . .
RUN npx turbo prune controlthemarket-web --docker

# 2) Install pruned deps.
# --no-frozen-lockfile (not --frozen): the root pins a version-selector pnpm override
# ("uuid@11": "11.1.1") and `turbo prune` drops the matching package snapshot from the pruned
# lockfile, so a frozen install fails (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY). Non-frozen lets pnpm
# repair the gap in-image. The root lockfile itself is consistent (frozen install passes on the host).
FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# 3) Build (NEXT_PUBLIC_* must be present at build time — they are inlined into the client bundle).
ARG NEXT_PUBLIC_CTM_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_USE_MOCK=false
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
RUN pnpm turbo run build --filter=controlthemarket-web

# 4) Minimal runner (standalone server).
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/controlthemarket-main/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/controlthemarket-main/.next/static ./Frontend/controlthemarket-main/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/controlthemarket-main/public ./Frontend/controlthemarket-main/public
USER nextjs
EXPOSE 3000
# Standalone server entrypoint is nested under the app path in a monorepo build.
CMD ["node", "Frontend/controlthemarket-main/server.js"]
