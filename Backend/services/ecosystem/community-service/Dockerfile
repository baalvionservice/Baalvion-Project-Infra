# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/ecosystem/community-service/Dockerfile -t community-service .
FROM node:20.12-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune community-service --docker

# The @baalvion/* packages this service depends on are TypeScript and compile to dist/, which
# is .gitignored and therefore never in the build context. turbo prune's filtered install cannot
# build them: it omits the devDeps (tsup) and the root tsconfig.base.json those builds need, and
# it cannot resolve type deps of packages reached only transitively. So build them exactly the
# way deploy/consolidated/Dockerfile.node does — a full Backend workspace install with devDeps —
# and carry the dist/ forward. Skipping this leaves paymentSpine.js's top-level
# require('@baalvion/payment-consistency') throwing at module load, so the service never boots.
FROM base AS pkgbuild
COPY deploy/consolidated/pnpm-workspace.docker.yaml ./pnpm-workspace.yaml
COPY package.json pnpm-lock.yaml tsconfig.base.json ./
COPY Backend ./Backend
RUN pnpm install --no-frozen-lockfile --prod=false \
 && pnpm -r --filter "./Backend/packages/*" run build \
 && mkdir -p /dists \
 && for d in Backend/packages/*/dist; do mkdir -p "/dists/$(dirname "$d")"; cp -r "$d" "/dists/$(dirname "$d")/"; done

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile --filter community-service...
COPY --from=pruner /repo/out/full/ ./
# dist/ only — merges into the pruned package dirs without dragging in build-stage deps.
COPY --from=pkgbuild /dists/Backend/packages ./Backend/packages
RUN pnpm deploy --filter=community-service --prod /out

FROM node:20.12-alpine AS final
# Patch OS packages (e.g. openssl) and drop the runtime-unused npm/corepack shipped in the
# node base image (its bundled deps are the source of the image-layer CVE findings).
RUN apk upgrade --no-cache \
    && apk add --no-cache dumb-init \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3064
USER app
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3064),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
