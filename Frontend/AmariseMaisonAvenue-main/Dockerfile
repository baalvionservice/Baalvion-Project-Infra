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

# 2) Install pruned deps.
# --no-frozen-lockfile (not --frozen): the root pins a version-selector pnpm override
# ("uuid@11": "11.1.1") and `turbo prune` drops the matching package snapshot from the pruned
# lockfile, so a frozen install fails (ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY). Non-frozen lets pnpm
# repair the gap in-image. The root lockfile itself is consistent (frozen install passes on the host).
FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# 3) Build (NEXT_PUBLIC_* must be present here).
# These ARGs are the exact build-time variables the storefront source consumes for the
# MVP flows (product listing, cart, order creation, Razorpay checkout, CMS reads).
ARG NEXT_PUBLIC_COMMERCE_URL
ARG NEXT_PUBLIC_COMMERCE_API_URL
ARG NEXT_PUBLIC_ORDER_URL
ARG NEXT_PUBLIC_INVENTORY_URL
ARG NEXT_PUBLIC_CMS_URL
ARG NEXT_PUBLIC_CMS_WEBSITE_SLUG
ARG NEXT_PUBLIC_STORE_ID
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEDIA_HOST
# CRITICAL: ARG alone is NOT visible to `next build`. Each value must be re-exported as a
# NEXT_PUBLIC_* ENV so Next inlines it into the client bundle. Without these ENV lines the
# build bakes the localhost code-defaults regardless of --build-arg.
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production \
    NEXT_PUBLIC_COMMERCE_URL=${NEXT_PUBLIC_COMMERCE_URL} \
    NEXT_PUBLIC_COMMERCE_API_URL=${NEXT_PUBLIC_COMMERCE_API_URL} \
    NEXT_PUBLIC_ORDER_URL=${NEXT_PUBLIC_ORDER_URL} \
    NEXT_PUBLIC_INVENTORY_URL=${NEXT_PUBLIC_INVENTORY_URL} \
    NEXT_PUBLIC_CMS_URL=${NEXT_PUBLIC_CMS_URL} \
    NEXT_PUBLIC_CMS_WEBSITE_SLUG=${NEXT_PUBLIC_CMS_WEBSITE_SLUG} \
    NEXT_PUBLIC_STORE_ID=${NEXT_PUBLIC_STORE_ID} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_MEDIA_HOST=${NEXT_PUBLIC_MEDIA_HOST}
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
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3033),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
# Standalone server entrypoint is nested under the app path in a monorepo build.
CMD ["node", "Frontend/AmariseMaisonAvenue-main/server.js"]
