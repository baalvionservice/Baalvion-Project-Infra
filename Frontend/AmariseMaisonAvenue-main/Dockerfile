# Amarisé storefront — Next 15 standalone image (pnpm + Turborepo monorepo).
# Build context = REPO ROOT:  docker build -f Frontend/AmariseMaisonAvenue-main/Dockerfile -t amarise-web .
#
# NEXT_PUBLIC_* are baked at BUILD time — pass them as --build-arg (see ARGs below),
# not as runtime env. Point them at the PUBLIC prod API origin + media/CDN host.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo to just this app + its workspace deps
FROM base AS pruner
COPY . .
RUN npx turbo prune amarise-maison-avenue-web --docker

# 2) Install pruned deps (frozen lockfile)
FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# 3) Build (NEXT_PUBLIC_* must be present here)
ARG NEXT_PUBLIC_COMMERCE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STORE_ID
ARG NEXT_PUBLIC_MEDIA_HOST
ARG NEXT_PUBLIC_REFRESH_COOKIE_NAME
ARG NEXT_PUBLIC_ADMIN_CONSOLE_URL
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
RUN pnpm turbo run build --filter=amarise-maison-avenue-web

# 4) Minimal runner (standalone server)
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3033 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/AmariseMaisonAvenue-main/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/AmariseMaisonAvenue-main/.next/static ./Frontend/AmariseMaisonAvenue-main/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/AmariseMaisonAvenue-main/public ./Frontend/AmariseMaisonAvenue-main/public
USER nextjs
EXPOSE 3033
# Standalone server entrypoint is nested under the app path in a monorepo build.
CMD ["node", "Frontend/AmariseMaisonAvenue-main/server.js"]
