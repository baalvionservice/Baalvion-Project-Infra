// ============================================================================
// Baalvion stack — PM2 process definitions (PRODUCTION / launch posture)
// ----------------------------------------------------------------------------
// Source of truth for the FULL fleet. This config is hardened for external
// customers:
//
//   * Every backend service runs with NODE_ENV=production.
//   * Every frontend serves a PRODUCTION build — Next apps run `next start`
//     and Vite SPAs run `vite preview`. No app runs a dev/HMR server.
//   * No service borrows another service's dependencies via NODE_PATH — each
//     package resolves from its own installed node_modules.
//   * Restart hardening (see `harden` below) makes a crash or port race
//     self-heal with exponential backoff instead of crash-looping.
//
//   pm2 start ecosystem.config.js           # cold-start everything
//   pm2 start ecosystem.config.js --only X  # start one app
//   pm2 save                                # persist (what `pm2 resurrect` restores)
//
// IMPORTANT NOTES
//  * Frontends require a valid build BEFORE start (`pnpm build` → .next/ or
//    dist/). Without one, `next start` / `vite preview` exit immediately. Use
//    start-prod.ps1, which builds then starts in the correct order.
//  * Datastores run in DOCKER, not here: postgres (:5432), redis (:6379), the
//    financial postgres/redis (:5433/:6380), pgadmin. Start them first (and
//    wait for healthy) — start-prod.ps1 does this and avoids the startup storm
//    where every DB-backed service hammers Postgres at once.
//  * Docker-OWNED services are intentionally ABSENT here (single owner = Docker):
//    cms-service (:3011), law-service, payment-service, rbac-service. Do NOT add
//    them — a PM2 copy races Docker for the port and crash-loops.
// ============================================================================

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ── Fleet-wide production secrets ──────────────────────────────────────────
// auth-gateway fail-fasts under production unless INTERNAL_SERVICE_SECRET and
// GATEWAY_SIGNING_SECRET are real (non-dev) values, and downstream services must
// share the SAME GATEWAY_SIGNING_SECRET to trust gateway-signed requests. Rather
// than scatter (and desync) these across ~30 service .env files, they live in one
// gitignored file and are injected into every backend service below.
//
// The file is auto-generated with strong random secrets on first use (and by
// start-prod.ps1), so a cold `pm2 start` always boots production cleanly instead
// of crash-looping the gateway. It is gitignored (secrets/) — never committed.
const SHARED_KEYS = ['INTERNAL_SERVICE_SECRET', 'GATEWAY_SIGNING_SECRET', 'FINANCE_WEBHOOK_SECRET'];

function loadFleetSecrets() {
  const file = path.join(__dirname, 'secrets', 'fleet.prod.env');
  const out = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // File absent — generate strong secrets once so production can boot.
    try {
      SHARED_KEYS.forEach((k) => { out[k] = crypto.randomBytes(32).toString('hex'); });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const body =
        '# Auto-generated fleet-wide production S2S secrets — gitignored, never commit.\n' +
        '# Injected into every backend service by ecosystem.config.js so the gateway\n' +
        '# signing/internal secrets are identical across the fleet.\n' +
        SHARED_KEYS.map((k) => `${k}=${out[k]}`).join('\n') + '\n';
      fs.writeFileSync(file, body, { mode: 0o600 });
    } catch {
      /* read-only FS — fall back to process.env values, if any */
    }
  }
  return out;
}

const SHARED = loadFleetSecrets();

// Shared restart-hardening. After a crash (e.g. an EADDRINUSE port race on
// restart, or "the database system is starting up" during a cold boot), PM2
// waits with exponential backoff (250ms → 500 → 1000 …) before retrying, so the
// socket frees / the DB finishes booting and the next start succeeds. A start
// must stay up 10s to count as stable; give up after 15 unstable restarts.
const harden = {
  interpreter: 'node',
  exec_mode: 'fork',
  watch: false,
  autorestart: true,
  kill_timeout: 8000,
  min_uptime: 10000,
  max_restarts: 15,
  exp_backoff_restart_delay: 250,
  log_date_format: 'HH:mm:ss',
};

// Backend Node service — production runtime, resolves its own node_modules,
// inherits the fleet-wide S2S secrets. Per-service env (e.g. PORT) wins last.
const svc = (name, cwd, env = {}) => ({
  ...harden,
  name,
  cwd,
  script: './index.js',
  max_memory_restart: '600M',
  env: { NODE_ENV: 'production', ...SHARED, ...env },
});

// Next.js frontend serving a production build (`next start`). Build first.
const nextApp = (name, cwd, port, env = {}) => ({
  ...harden,
  name,
  cwd,
  script: './node_modules/next/dist/bin/next',
  args: `start -p ${port}`,
  max_memory_restart: '1500M',
  env: { NODE_ENV: 'production', PORT: String(port), ...env },
});

// Vite SPA serving a production build (`vite preview`). Build first.
const viteApp = (name, cwd, port) => ({
  ...harden,
  name,
  cwd,
  script: './node_modules/vite/bin/vite.js',
  args: `preview --port ${port} --host`,
  max_memory_restart: '500M',
  env: { NODE_ENV: 'production' },
});

module.exports = {
  apps: [
    // ── Backend services (production) ───────────────────────────────────
    svc('about-service', './Backend/services/ecosystem/about-service'),
    svc('admin-service', './Backend/services/platform/admin-service'),
    svc('auth-gateway', './Backend/services/identity/auth-gateway'),
    svc('auth-service', './Backend/services/identity/auth-service'),
    svc('brand-connector-service', './Backend/services/ecosystem/brand-connector-service'),
    svc('commerce-service', './Backend/services/commerce/commerce-service'),
    // Schema `crm`, brand-scoped (amarise-luxe). Now resolves its own node_modules
    // (pnpm install), so no NODE_PATH borrow from ir-service.
    svc('crm-service', './Backend/services/ecosystem/crm-service', { PORT: '3063' }),
    svc('ctm-service', './Backend/services/ecosystem/ctm-service'),
    svc('dashboard-service', './Backend/services/platform/dashboard-service'),
    svc('fulfillment-service', './Backend/services/commerce/fulfillment-service', { PORT: '3016' }),
    svc('imperialpedia-service', './Backend/services/knowledge/imperialpedia-service'),
    svc('insiders-service', './Backend/services/ecosystem/insiders-service'),
    svc('inventory-service', './Backend/services/commerce/inventory-service'),
    svc('ir-service', './Backend/services/ecosystem/ir-service'),
    svc('jobs-service', './Backend/services/ecosystem/jobs-service'),
    svc('market-service', './Backend/services/commerce/market-service'),
    // Now resolves its own node_modules (pnpm install) — no NODE_PATH borrow.
    svc('marketplace-service', './Backend/services/marketplace/marketplace-service'),
    svc('mining-service', './Backend/services/ecosystem/mining-service'),
    svc('notification-service', './Backend/services/infrastructure/notification-service'),
    svc('oauth-service', './Backend/services/identity/oauth-service'),
    // order-service REMOVED (finance consolidation) — order lifecycle is owned by
    // trade/order-execution-service. Do not re-add from a PM2 dump.
    svc('proxy-service', './Backend/services/infrastructure/proxy-service'),
    svc('real-estate-service', './Backend/services/ecosystem/real-estate-service'),
    // PORT pinned to :3040 — the realtime contract port (gateway dynamic.yml,
    // openapi, root docker-compose). Code default is 3026, which collided with
    // jobs-web. Now resolves its own node_modules — no NODE_PATH borrow.
    svc('realtime-service', './Backend/services/platform/realtime-service', { PORT: '3040' }),
    svc('session-service', './Backend/services/identity/session-service'),
    svc('trade-service', './Backend/services/commerce/trade-service'),

    // ── Frontends (production builds) ───────────────────────────────────
    // Next.js apps — `next start` against a prebuilt .next/. Run `pnpm build` first.
    nextApp('about-web', './Frontend/about-baalvion-main', 3020),
    nextApp('admin-platform', './Frontend/admin-platform', 3030),
    nextApp('amarise-web', './Frontend/AmariseMaisonAvenue-main', 3033),
    // :3043 (moved off :3040, the realtime-service contract port).
    nextApp('baalvion-com-web', './Frontend/baalvion-com-main', 3043),
    nextApp('brand-web', './Frontend/brand-connector-main', 3035),
    nextApp('ctm-web', './Frontend/controlthemarket-main', 3034),
    nextApp('dashboard-web', './Frontend/company-unified-Dashboard-main', 3024),
    nextApp('gti-web', './Frontend/Global-Trade-Infrastructure-main', 9003),
    nextApp('imperialpedia-web', './Frontend/Imperialpedia-main', 3029),
    nextApp('ir-web', './Frontend/IR-Baalvion-main', 3027),
    // :3026 is this app's own port (package.json).
    nextApp('jobs-web', './Frontend/Baalvion-Jobs-Portal-main', 3026),
    nextApp('law-web', './Frontend/Law-Elite-Network-main', 9002),
    nextApp('mining-web', './Frontend/Mining.Baalvion-main', 3028),
    // insiders-seo-web REMOVED — the Frontend/insiders-seo SEO site was deleted.

    // Vite SPAs — `vite preview` against a prebuilt dist/. Run `pnpm build` first.
    viteApp('founders-web', './Frontend/For Invstors and Founders', 8082),
    viteApp('proxy-web', './Frontend/Proxy-BaalvionStack', 8080),
  ],
};
