# Monorepo-aware build for the pnpm workspace (build model: Option A).
# BUILD CONTEXT MUST BE THE REPO ROOT:
#   docker build -f Backend/services/ecosystem/giftcard-service/Dockerfile -t giftcard-service .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune giftcard-service --docker

FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile --filter giftcard-service...
COPY --from=pruner /repo/out/full/ ./
RUN pnpm deploy --filter=giftcard-service --prod /out

FROM node:20-alpine AS final
# Apply the Alpine security patch for OpenSSL in-place (CVE-2026-45447 HIGH: heap
# use-after-free in PKCS7_verify). The pinned base image had not yet republished a digest
# with the patched package, so --upgrade pulls it from the Alpine package index without
# adding any new packages.
RUN apk add --no-cache --upgrade openssl \
    && apk add --no-cache dumb-init \
    && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3065
USER app
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3065),r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
