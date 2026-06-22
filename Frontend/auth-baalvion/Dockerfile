# Multi-stage build for the shared auth surface (Next.js standalone output).
# Built from the repo ROOT so the pnpm workspace lockfile is available.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# Install workspace deps for auth-baalvion AND build in ONE stage, so the package's node_modules
# (which holds the `next` bin) is present for `pnpm build`. auth-baalvion has no @baalvion/*
# workspace deps, so the full lockfile + its own manifest is enough for a frozen install.
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY Frontend/auth-baalvion/package.json Frontend/auth-baalvion/package.json
RUN pnpm install --filter auth-baalvion... --frozen-lockfile
COPY Frontend/auth-baalvion ./Frontend/auth-baalvion
# NEXT_PUBLIC_* are inlined into the client bundle at build time, so they must be present as ENV
# for `pnpm build`. The Turnstile SITE key is public (safe to bake); the SECRET key lives only on
# auth-service. Empty defaults keep dev/CI image builds runnable (the captcha widget just doesn't
# render, and the server-side check is skipped when its secret is unset).
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
ARG NEXT_PUBLIC_ALLOWED_RETURN_HOSTS=""
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_ALLOWED_RETURN_HOSTS=$NEXT_PUBLIC_ALLOWED_RETURN_HOSTS
WORKDIR /app/Frontend/auth-baalvion
RUN pnpm build

# Minimal runner. Next's standalone output preserves the monorepo path, so root the app at /app:
# server.js is emitted at /app/Frontend/auth-baalvion/server.js.
FROM base AS runner
ENV NODE_ENV=production PORT=3055 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/Frontend/auth-baalvion/.next/standalone ./
COPY --from=build /app/Frontend/auth-baalvion/.next/static ./Frontend/auth-baalvion/.next/static
EXPOSE 3055
CMD ["node", "Frontend/auth-baalvion/server.js"]
