# Frontend Fixes Applied

**Date:** 2026-06-20
All changes are source/config/Docker only — no application logic was modified.

---

## 1. Law Elite Network

### 1a. `next.config.ts` — enable standalone output
The app forced `output: undefined`, but its Dockerfile copies `.next/standalone` + runs `server.js`. The image could never start.

```diff
- output: undefined,
+ // Self-contained server bundle so the Dockerfile's `.next/standalone` + server.js exist.
+ // Gated off on win32 (Next standalone symlink emission is unreliable on Windows dev boxes);
+ // Docker/CI builds run on Linux where standalone is emitted correctly.
+ output: process.platform === 'win32' ? undefined : 'standalone',
```

### 1b. New `public/.gitkeep`
Dockerfile runs `COPY --from=builder /app/public ./public`, but the app had **no `public/` dir** → build failure. Added placeholder dir (Next standalone does not require static assets here).

### 1c. New `.dockerignore`
Single-dir build context with no ignore file → `COPY . .` copied the Windows host `node_modules` over the clean Linux install. Added `.dockerignore` excluding `node_modules`, `.next`, build artifacts, secrets.

---

## 2. Admin Platform

### 2a. `Dockerfile` — replaced broken `npm ci` image
The default `Dockerfile` used `npm ci` + `package-lock.json`. admin-platform is a **pnpm workspace member** (no lockfile) depending on `@baalvion/auth-sdk` (`workspace:*`) — `npm ci` can never resolve it. Replaced with the monorepo-aware `turbo prune` + pnpm image (matching the already-working `Dockerfile.deploy`).

Build args wired: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_CMS_API_URL`, `NEXT_PUBLIC_AUTH_URL`, `NEXT_PUBLIC_APP_ENV`.

### 2b. New `Dockerfile.dockerignore`
Root `.dockerignore` excludes the whole `Frontend/` tree; a per-Dockerfile override is required so the repo-root build sees Frontend source + workspace `package.json`s.

---

## 3. Imperialpedia *(new)*

### 3a. `next.config.ts` — added standalone output
```diff
  reactStrictMode: true,
+ output: process.platform === 'win32' ? undefined : 'standalone',
  typescript: {
```

### 3b. New `Dockerfile` (monorepo-aware turbo prune + pnpm)
Build args wired: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_IMPERIALPEDIA_API_URL`, `NEXT_PUBLIC_CMS_PUBLIC_URL`, `NEXT_PUBLIC_CMS_SITE_SLUG`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_PLATFORM_URL`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT`. Port 3029, non-root, healthcheck.

### 3c. New `Dockerfile.dockerignore`

---

## 4. Global Trade Infrastructure (GTI) *(new)*

### 4a. `next.config.ts` — added standalone output
```diff
  const nextConfig: NextConfig = {
+   output: process.platform === 'win32' ? undefined : 'standalone',
    // Server-only AI/telemetry runtime.
```

### 4b. New `Dockerfile` (monorepo-aware turbo prune + pnpm + Prisma)
- Build args: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TELEMETRY_INGEST`.
- `pnpm install --no-frozen-lockfile --ignore-scripts`: GTI's `postinstall: prisma generate` would fail in the pruned installer stage (schema lives in `out/full`, not `out/json`). Prisma is generated in the build stage instead (`turbo run build` → `prisma generate && next build`).
- `openssl` added to the alpine base for the Prisma query engine.
- Healthcheck hits the existing `/api/health` route.
- Prisma `prisma/` (schema + migrations) copied into the runner for an optional `migrate deploy` sidecar.

### 4c. New `Dockerfile.dockerignore`

> **Validation note:** GTI is the one app carrying residual risk — nested pnpm-workspace + Prisma client tracing into the Next standalone bundle. Run one clean Linux `docker build` and confirm the Prisma client loads at runtime before promoting.

---

## 5. Proxy BaalvionStack (Vite SPA) *(new)*

### 5a. New `Dockerfile` (monorepo-aware turbo prune → static nginx)
- Stage 1–3: `turbo prune` + pnpm install + `vite build` → `dist/`.
- Stage 4: `nginxinc/nginx-unprivileged:1.27-alpine` (**non-root**, uid 101, listens on 8080).
- Build args (Vite inlines at build time): `VITE_API_PLATFORM_BASE_URL`, `VITE_API_AUTH_BASE_URL`, `VITE_GATEWAY_URL`, `VITE_BFF_MODE`, `VITE_PROXY_GATEWAY_HOST`, `VITE_PROXY_GATEWAY_HTTP_PORT`, `VITE_PROXY_GATEWAY_SOCKS_PORT`, `VITE_PAYU_ACTION_URL`.

### 5b. New `nginx.conf.template`
- SPA fallback (`try_files ... /index.html`), gzip, long-cache for `/assets/`.
- `/healthz` endpoint for ALB/ECS/Docker healthcheck.
- **`/auth-bff/` reverse-proxy → auth gateway** (the Vite config explicitly requires this in prod so the httpOnly refresh cookie flows same-origin). Target is `${AUTH_PROXY_TARGET}` / `${AUTH_PROXY_HOST}`, substituted at container start via the nginx image's envsubst.

### 5c. New `Dockerfile.dockerignore`

---

## Files changed/created

| File | Action |
|------|--------|
| `Frontend/Law-Elite-Network-main/next.config.ts` | edited (standalone) |
| `Frontend/Law-Elite-Network-main/public/.gitkeep` | created |
| `Frontend/Law-Elite-Network-main/.dockerignore` | created |
| `Frontend/admin-platform/Dockerfile` | replaced |
| `Frontend/admin-platform/Dockerfile.dockerignore` | created |
| `Frontend/Imperialpedia-main/next.config.ts` | edited (standalone) |
| `Frontend/Imperialpedia-main/Dockerfile` | created |
| `Frontend/Imperialpedia-main/Dockerfile.dockerignore` | created |
| `Frontend/Global-Trade-Infrastructure-main/next.config.ts` | edited (standalone) |
| `Frontend/Global-Trade-Infrastructure-main/Dockerfile` | created |
| `Frontend/Global-Trade-Infrastructure-main/Dockerfile.dockerignore` | created |
| `Frontend/Proxy-BaalvionStack/Dockerfile` | created |
| `Frontend/Proxy-BaalvionStack/nginx.conf.template` | created |
| `Frontend/Proxy-BaalvionStack/Dockerfile.dockerignore` | created |
