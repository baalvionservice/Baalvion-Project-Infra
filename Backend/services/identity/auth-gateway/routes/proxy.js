'use strict';
// Real /api/* proxy engine (Phase 6C). Mounted behind requireSession + attachUser + requireCsrf.
// TRUST BOUNDARY: strips any client-supplied auth/cookie, injects ONLY server-resolved, signed
// identity headers. In hybrid mode it also presents the server-side RS256 Bearer so not-yet-migrated
// backends keep verifying JWT; in strict mode backends trust the gateway headers via gatewayTrust().
// Phase 7: additionally injects v2 identity envelope (x-identity-envelope + x-envelope-sig).
const { createProxyMiddleware } = require('http-proxy-middleware');
const { signIdentity } = require('../lib/crypto');
const { build: buildEnvelope } = require('../lib/envelope');
const { detectGeo } = require('../lib/geoDetect');
const config = require('../config/appConfig');

// /api/<svc>/... → domain backend. Extend as services are onboarded.
const TARGETS = {
  mining:        process.env.SVC_MINING        || 'http://localhost:3003',
  imperialpedia: process.env.SVC_IMPERIALPEDIA || 'http://localhost:3004',
  ir:            process.env.SVC_IR            || 'http://localhost:3008',
  dashboard:     process.env.SVC_DASHBOARD     || 'http://localhost:3009',
  ctm:           process.env.SVC_CTM           || 'http://localhost:3017',
  // orders: REMOVED — order-service is deprecated (order-service_DEPRECATED). The /trade/v1/orders
  // subtree is owned by the GTOS order-execution-service (see ORDER_EXECUTION below); all other
  // order routing now lives in the trade domain. The bare :3013 Node default is gone so finance/
  // commerce can never resolve back to the retired Node order-service.
  proxy:         process.env.SVC_PROXY         || 'http://localhost:4000',
  // Phase 6E-5 — island backends (dual-auth via bffBridge; gateway is the preferred path).
  insiders:       process.env.SVC_INSIDERS     || 'http://localhost:3050',
  trade:          process.env.SVC_TRADE        || 'http://localhost:3025',
  // financial-services-java — system of record for money/KYC/risk (Spring resource servers,
  // base path /api/v1/...). RS256-verified against auth-service when APP_SECURITY_ENABLED=true,
  // gateway-trusted (X-Tenant-ID) in dev. risk moved 3025→3035 to free :3025 for trade.
  // NOTE: payment/ledger/account/escrow/settlement are NOT defined here — they are owned solely by
  // the FINANCE block below (Java suite, 130xx). Keeping legacy bare-port fallbacks (3014/3015/…)
  // here risked finance resolving to the retired Node ledger/payment twins, so they were removed.
  // The remaining money services below are Java-only (no Node twin) and keep their 30xx defaults,
  // which the financial-services-java compose still publishes for them.
  reconciliation: process.env.SVC_RECONCILIATION || 'http://localhost:3019',
  'finance-audit':process.env.SVC_FIN_AUDIT      || 'http://localhost:3020',
  reporting:      process.env.SVC_REPORTING      || 'http://localhost:3024',
  risk:           process.env.SVC_RISK           || 'http://localhost:3035',
};

// NEW finance microservices (trade-finance/credit/fx/wallet, financial-services-java).
// Unlike the legacy entries above, these KEEP the first path segment and prepend the Spring
// base path /api/v1 — the resource segment IS the controller root, so nothing is stripped and
// no trailing slash is ever introduced (collection POSTs like /api/wallets stay exact):
//   /api/letters-of-credit/{id} → :3036/api/v1/letters-of-credit/{id}
//   /api/fx/rates/USD/EUR       → :3038/api/v1/fx/rates/USD/EUR
//   /api/wallets (POST open)    → :3039/api/v1/wallets
const FINANCE = {
  'letters-of-credit': process.env.SVC_TRADE_FINANCE || 'http://localhost:13036',
  'bank-guarantees':   process.env.SVC_TRADE_FINANCE || 'http://localhost:13036',
  'invoice-finance':   process.env.SVC_CREDIT        || 'http://localhost:3037',
  bnpl:                process.env.SVC_CREDIT        || 'http://localhost:3037',
  fx:                  process.env.SVC_FX            || 'http://localhost:3038',
  wallets:             process.env.SVC_WALLET        || 'http://localhost:3039',
  // Finance & Treasury sprint (2026-06-11): the system-of-record money services. Their Java
  // @RequestMapping roots are /api/v1/<segment>, so the FINANCE rule (`/api/v1` + kept segment)
  // hits them exactly — unlike the legacy TARGETS entries (payment/ledger/...) which strip the
  // prefix and miss the Spring base path. These take precedence over TARGETS (router checks
  // FINANCE first), so /finance-bff/ledger/entries → :13014/api/v1/ledger/entries, etc.
  ledger:     process.env.SVC_LEDGER     || 'http://localhost:13014',
  payments:   process.env.SVC_PAYMENT    || 'http://localhost:13015',
  accounts:   process.env.SVC_ACCOUNT    || 'http://localhost:13016',
  escrow:     process.env.SVC_ESCROW     || 'http://localhost:13017',
  settlement: process.env.SVC_SETTLEMENT || 'http://localhost:13018',
  // invoice-service (:13021) — Invoice Management + Accounts Receivable + Accounts Payable.
  // Controller roots /api/v1/{invoices,receivables,payables}; all served by the one service.
  invoices:    process.env.SVC_INVOICE || 'http://localhost:13021',
  receivables: process.env.SVC_INVOICE || 'http://localhost:13021',
  payables:    process.env.SVC_INVOICE || 'http://localhost:13021',
  // §3 trade microservices (financial-services-java, built+committed by a parallel session).
  // Gateway segment === the Java @RequestMapping root (verified from source) so the FINANCE
  // rule (`/api/v1` + path) hits the controller exactly. Confirmed roots:
  //   deal-room-service        /api/v1/deal-rooms     :3040
  //   smart-contract-service   /api/v1/contracts      :3041
  //   trade-intelligence-svc   /api/v1/intelligence   :3043
  //   dispute-service          /api/v1/disputes       :3044
  //   aml-service              /api/v1/aml            :3045
  //   trust-score-service      /api/v1/trust-scores   :3046
  'deal-rooms':   process.env.SVC_DEAL_ROOM     || 'http://localhost:13040',
  contracts:      process.env.SVC_SMART_CONTRACT || 'http://localhost:3041',
  intelligence:   process.env.SVC_TRADE_INTEL   || 'http://localhost:3043',
  disputes:       process.env.SVC_DISPUTE       || 'http://localhost:3044',
  aml:            process.env.SVC_AML           || 'http://localhost:3045',
  'trust-scores': process.env.SVC_TRUST_SCORE   || 'http://localhost:3046',
  // DEFERRED: payment-rails-service (:3042) — its controller root is /api/v1/payments, which the
  // generic `/api/v1`+segment rule can't produce from a `payment-rails` segment, and a `payments`
  // segment is confusingly close to the legacy `payment` (:3015). Needs either a custom rewrite or
  // a Java @RequestMapping rename to /api/v1/payment-rails. Wire once that decision is made.
};

const svcOf = (url) => (url.split('?')[0].split('/')[1] || '');

// R3 cutover: order lifecycle is owned by the GTOS order-execution-service (schema `oms`,
// money-truth + saga). Only the /trade/v1/orders subtree moves there; RFQ/quote/deal/listing/
// escrow stay on the legacy trade-service. The standard /<svc>-strip rewrite still applies
// (it produces /v1/orders..., which order-execution mounts), so only the target differs.
const ORDER_EXECUTION = process.env.SVC_ORDER_EXECUTION || 'http://localhost:3052';
const isTradeOrders = (url) => /^\/trade\/v1\/orders(\/|$)/.test(String(url).split('?')[0]);

const proxy = createProxyMiddleware({
  changeOrigin: true,
  // mounted at /api → req.url is /<svc>/... ; resolve the per-service target.
  router: (req) => (isTradeOrders(req.url) ? ORDER_EXECUTION : (FINANCE[svcOf(req.url)] || TARGETS[svcOf(req.url)])),
  // Legacy services: strip the /<svc> prefix (per-backend base path lives on the target).
  // Finance services: KEEP the segment and prepend /api/v1 (the Spring controller base path).
  // Trade orders take the legacy strip branch → /v1/orders... (order-execution's mount).
  pathRewrite: (path) => (FINANCE[svcOf(path)] ? '/api/v1' + path : (path.replace(/^\/[^/?]+/, '') || '/')),
  // http-proxy-middleware v3: event handlers live under `on` (the v2 top-level
  // onProxyReq/onError are ignored, which silently disables the trust boundary).
  on: {
    proxyReq: (proxyReq, req) => {
      proxyReq.removeHeader('authorization');      // NEVER forward a client token
      proxyReq.removeHeader('cookie');             // NEVER leak the session cookie to backends
      // defensively strip any client-supplied identity headers before we inject ours
      proxyReq.removeHeader('x-user-id');
      proxyReq.removeHeader('x-org-id');
      proxyReq.removeHeader('x-roles');
      proxyReq.removeHeader('x-session-id');
      proxyReq.removeHeader('x-gateway-signature');
      proxyReq.removeHeader('x-identity-envelope'); // Phase 7 — client cannot spoof envelope
      proxyReq.removeHeader('x-envelope-sig');
      proxyReq.removeHeader('x-tenant-id');         // financial-services-java tenant — gateway-resolved only
      const u = req.user;
      if (!u) { proxyReq.destroy(new Error('NO_SESSION')); return; }
      // v1 identity headers — kept for backends that have not yet upgraded to v2 envelope.
      proxyReq.setHeader('x-user-id', String(u.userId));
      proxyReq.setHeader('x-org-id', u.orgId ? String(u.orgId) : '');
      // X-Tenant-ID for the financial-services-java resource servers: their TenantContext reads
      // the tenant from the RS256 JWT when secured, and falls back to this header in dev. Harmless
      // to Node backends (ignored). Resolved server-side from the session org — never client-supplied.
      proxyReq.setHeader('x-tenant-id', u.tenantId ? String(u.tenantId) : (u.orgId ? String(u.orgId) : ''));
      proxyReq.setHeader('x-roles', JSON.stringify(u.roles || []));
      proxyReq.setHeader('x-session-id', u.sessionId ? String(u.sessionId) : '');
      proxyReq.setHeader('x-gateway-signature', signIdentity(u));
      // Phase 7 — v2 signed envelope (x-identity-envelope + x-envelope-sig).
      // geo comes from geoFence middleware if mounted; falls back to per-request detection.
      const geo = req._geoDetected || detectGeo(req);
      const { payload: envPayload, signature: envSig } = buildEnvelope(u, {
        secret:     config.gatewaySigningSecret,
        region:     config.region,
        workloadId: config.workloadId,
        geo,
        ttlSeconds: config.envelopeTtl,
      });
      proxyReq.setHeader('x-identity-envelope', envPayload);
      proxyReq.setHeader('x-envelope-sig', envSig);
      // hybrid only: present the server-side RS256 Bearer for backends still verifying JWT.
      if (config.enforcementMode !== 'strict' && req._token) proxyReq.setHeader('authorization', `Bearer ${req._token}`);
    },
    error: (err, _req, res) => { try { res.status(502).json({ error: { code: 'BAD_GATEWAY', message: err.message } }); } catch { /* */ } },
  },
});

// Guard: unknown service prefix → 404 (don't proxy to undefined target).
module.exports = function apiProxy(req, res, next) {
  if (!TARGETS[svcOf(req.url)] && !FINANCE[svcOf(req.url)]) return res.status(404).json({ error: { code: 'UNKNOWN_SERVICE', message: 'No backend for this /api prefix' } });
  return proxy(req, res, next);
};
