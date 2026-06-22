# Multi-stage build for the shared auth surface (Next.js standalone output).
# Built from the repo root so the pnpm workspace lockfile is available.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY Frontend/auth-baalvion/package.json Frontend/auth-baalvion/package.json
RUN pnpm install --filter auth-baalvion... --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY Frontend/auth-baalvion ./Frontend/auth-baalvion
COPY package.json pnpm-workspace.yaml ./
WORKDIR /app/Frontend/auth-baalvion
# NEXT_PUBLIC_* are inlined into the client bundle at build time, so they must be present for
# `pnpm build`. The Turnstile SITE key is public (safe to bake); the matching SECRET key lives
# only on auth-service. Empty defaults keep local/dev image builds runnable (the captcha widget
# simply does not render, and the server-side check is skipped when its secret is unset).
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
ARG NEXT_PUBLIC_ALLOWED_RETURN_HOSTS=""
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_ALLOWED_RETURN_HOSTS=$NEXT_PUBLIC_ALLOWED_RETURN_HOSTS
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app/Frontend/auth-baalvion
COPY --from=build /app/Frontend/auth-baalvion/.next/standalone ./
COPY --from=build /app/Frontend/auth-baalvion/.next/static ./Frontend/auth-baalvion/.next/static
COPY --from=build /app/Frontend/auth-baalvion/public ./Frontend/auth-baalvion/public
EXPOSE 3055
ENV PORT=3055
# standalone server entry is emitted at the app root inside the bundle
CMD ["node", "Frontend/auth-baalvion/server.js"]
