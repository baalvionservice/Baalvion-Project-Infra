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
