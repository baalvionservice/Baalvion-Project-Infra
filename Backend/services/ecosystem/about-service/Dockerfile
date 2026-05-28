# Monorepo-aware build for the pnpm workspace (build model: Option A — pnpm workspace).
# The BUILD CONTEXT MUST BE THE REPO ROOT so packages/* and the workspace lockfile
# are visible. Build it with:
#   docker build -f Backend/services/ecosystem/about-service/Dockerfile -t baalvion-about .
# docker-compose / CI set context = repo root and point dockerfile at this file.

# ── base: Node 20 + corepack-pinned pnpm (root packageManager = pnpm@9.15.0) ──
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# ── prune: extract about-service + its workspace deps + a pruned lockfile ─────
# turbo prune emits out/json (manifests), out/full (source), out/pnpm-lock.yaml.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.14 prune about-service --docker

# ── installer: deterministic install from the pruned lockfile, then deploy ────
FROM base AS installer
COPY .npmrc ./
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --filter about-service...
COPY --from=pruner /repo/out/full/ ./
# pnpm deploy flattens workspace deps (@baalvion/auth-node) into a self-contained bundle.
RUN pnpm deploy --filter=about-service --prod /out

# ── final: minimal runtime image, no workspace, no dev deps ───────────────────
FROM node:20-alpine AS final
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /out ./
EXPOSE 3010
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
