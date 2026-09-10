# Baalvion Stack (baalvionstack.com) — Next 15 standalone image.
#
# Build context = REPO ROOT, because this is a pnpm workspace member and turbo prune has to see
# the root lockfile:
#
#   docker build -f Frontend/baalvion-stack/Dockerfile -t baalvion-stack-web:local .
#
# This app reads @baalvion/sites at BUILD time — the catalogue, the navigation, the sitemap and
# the JSON-LD are all generated from the registry and baked into static HTML. So the image is a
# snapshot of the registry at build time, and registering a new product means rebuilding this
# image. That is the intended trade: one source of truth, no runtime lookup, no drift.
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# 1) Prune the monorepo down to this app and the workspace packages it actually uses.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune baalvion-stack-web --docker

# 2) Install the pruned dependency set.
#    --no-frozen-lockfile: turbo prune can drop catalog/override snapshots that a frozen install
#    then rejects. The lockfile is still the input; only the strictness relaxes.
FROM base AS installer
COPY .npmrc* ./
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# 3) Build.
#    @baalvion/sites is a tsup package whose dist/ is gitignored, so the app's own build cannot
#    resolve it until the package has been built. turbo's dependency graph handles that, but only
#    if the filter is allowed to build dependencies — hence no `--only`.
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=pruner /app/out/full/ ./
# turbo prune copies package directories, not loose root files, so the shared tsconfigs have to
# be brought in by hand. BOTH are needed: @baalvion/sites lives under Backend/ and extends
# Backend/tsconfig.base.json, and without it the package's DTS step fails with TS5083 several
# minutes into the build.
COPY tsconfig.base.json ./tsconfig.base.json
COPY Backend/tsconfig.base.json ./Backend/tsconfig.base.json
# --env-mode=loose: turbo 2.x filters the task environment to what turbo.json declares. Strict
# filtering has previously dropped build-shaping variables silently, producing a build that
# succeeds while emitting no .next/standalone, and failing several minutes later in the runner
# stage on a missing COPY. Loose mode is scoped to this build and changes no shared turbo config.
RUN pnpm dlx turbo@2.9.14 run build --filter=baalvion-stack-web --env-mode=loose

# 4) Minimal runner.
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3072 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/baalvion-stack/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/baalvion-stack/.next/static ./Frontend/baalvion-stack/.next/static
# public/ carries the product screenshots. Without it every card renders an empty frame.
COPY --from=installer --chown=nextjs:nodejs /app/Frontend/baalvion-stack/public ./Frontend/baalvion-stack/public
USER nextjs
EXPOSE 3072
# The app has no /api/health route, so the healthcheck asks for the home page. <500 is the right
# bar: it proves the server renders, and does not fail the container on a 404.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3072)+'/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "Frontend/baalvion-stack/server.js"]
