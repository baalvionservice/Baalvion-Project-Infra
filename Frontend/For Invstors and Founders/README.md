# Baalvion Insiders — Founder ↔ Investor Platform

The members app where **founders find investors who recently funded businesses like theirs** and raise
their round faster. Part of the Baalvion platform. © Baalvion. All rights reserved.

## Stack
- **Frontend:** Vite + React + TypeScript (this app) — the authenticated members surface
  (dashboards, forums, deals, investors, founders, the Protocol sub-app).
- **Backend:** `Backend/services/ecosystem/insiders-service` (Node.js + Express + Sequelize + PostgreSQL).
- **Auth:** canonical **auth-gateway BFF** (HttpOnly cookies + CSRF, RS256 via auth-service). No tokens in JS.
- **Public SEO surface:** a separate server-rendered **Next.js** app indexes founder/investor profiles
  (see `Frontend/insiders-seo`).

## Run (dev)
```bash
npm install
npm run dev      # http://localhost:8082
```
Requires the backend (`insiders-service` on :3050), the auth-gateway (:3099), Postgres and Redis running.
Dev proxies (`/auth-bff` → gateway, `/insiders-api` → insiders-service) keep the browser same-origin so the
gateway cookies work without CORS.

## Scripts
- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the build

## Environment
- `VITE_GATEWAY_URL` (default `/auth-bff`) — auth + authenticated data via the gateway.
- `VITE_INSIDERS_URL` (default `/insiders-api`) — anonymous/public reads + storage.
