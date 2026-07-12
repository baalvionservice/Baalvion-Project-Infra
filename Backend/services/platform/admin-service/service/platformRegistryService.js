'use strict';
// Platform Management registry: the external Baalvion properties surfaced on the
// central dashboard's "Platform Management" panel + the cross-platform revenue rollup.
// This is a narrower, practical slice of the registry-driven consolidation described in
// docs/platform-admin/00-MIGRATION-PRD.md (full Platform→Product→Module→Resource model,
// DB-backed, ~14 products) — that PRD is a much larger, not-yet-executed migration; this
// covers the 5 properties actually requested, config-driven, with no fabricated status.
// A platform with no configured health/revenue URL reports 'not_configured' rather than a
// fake green check; a revenue field with no real source is omitted, never invented.

const analyticsService = require('./analyticsService');

const HEALTH_TIMEOUT_MS = 4000;

// Proxy-BaalvionStack (proxy-service) and Signal/Baalvion Intelligence (news-service) already
// run inside this box's own Docker network as app-edge-realtime / app-platform — reachable by
// internal hostname, no extra config needed. CTM and GTI are deployed off-box (CTM on its own
// Vercel+backend host, GTI on Firebase App Hosting with `trade.baalvion.com` not yet wired at
// the edge per docs/architecture/PLATFORM-ARCHITECTURE-REFERENCE.md) — their URLs must be
// supplied via env once an operator points them at a real reachable address.
const REGISTRY = [
  {
    key: 'ctm',
    name: 'ControlTheMarket',
    domain: 'controlthemarket.com',
    adminUrl: 'https://controlthemarket.com',
    // No default: ctm-service is off-box and its own frontend's documented production
    // default (`https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1`, see
    // controlthemarket-main/README.md) routes through api.baalvion.com's gateway — but that
    // gateway is documented elsewhere in this platform as 404ing for non-public management
    // routes (see cms_content_migrated_admin_routing notes: "api.baalvion.com/api/v1/<domain>/
    // <service>/* 404s for management routes"). Guessing that default here risks a false
    // "down"/"unreachable" status instead of an honest "not configured" one, so CTM_SERVICE_URL
    // is required explicitly — set it to ctm-service's actually-verified-reachable base
    // (bare host for /health, `<base>/api/v1` or `<base>/v1` for /revenue/*).
    healthUrl: process.env.CTM_SERVICE_URL ? `${process.env.CTM_SERVICE_URL}/health` : null,
    revenue: process.env.CTM_SERVICE_URL
      ? { type: 'ctm', baseUrl: process.env.CTM_SERVICE_URL, auth: 'forward' }
      : null,
  },
  {
    key: 'proxy',
    name: 'Proxy-BaalvionStack',
    domain: 'proxy.baalvionstack.com',
    adminUrl: 'https://proxy.baalvionstack.com/admin',
    healthUrl: `${process.env.PROXY_SERVICE_URL || 'http://app-edge-realtime:4000'}/health`,
    // proxy-service is a documented separate RS256 self-issuer (own keypair, not the central
    // auth-service JWKS) — a central admin bearer will NOT verify there. Revenue calls need a
    // pre-minted proxy-service admin token supplied by ops, not the caller's own token.
    revenue: {
      type: 'proxy',
      baseUrl: process.env.PROXY_SERVICE_URL || 'http://app-edge-realtime:4000',
      auth: 'static-token',
      tokenEnv: 'PROXY_SERVICE_ADMIN_TOKEN',
    },
  },
  {
    key: 'signal',
    name: 'Baalvion Intelligence',
    domain: 'signal.baalvion.com',
    adminUrl: 'https://signal.baalvion.com/dashboard',
    healthUrl: `${process.env.NEWS_SERVICE_URL || 'http://app-platform:3045'}/health`,
    // Confirmed (2026-07-12 audit): signal.baalvion.com's billing page is hardcoded mock data;
    // news-service has no payment/subscription model at all. No revenue source exists.
    revenue: null,
  },
  {
    key: 'gti',
    name: 'GTI (Global Trade Infrastructure)',
    domain: 'trade.baalvion.com',
    // trade.baalvion.com is not actually wired at the edge yet (Caddyfile only has it as a
    // commented example; GTI is deployed on Firebase App Hosting, not this box) — point the
    // admin link at the real GTI URL once ops confirms it, via env.
    adminUrl: process.env.GTI_ADMIN_URL || 'https://trade.baalvion.com',
    healthUrl: process.env.GTI_SERVICE_URL ? `${process.env.GTI_SERVICE_URL}/health` : null,
    // GTI's finance data lives in financial-services-java's trade-finance/escrow/ledger
    // modules — not confirmed reachable from this box on a known port; wire once verified.
    revenue: null,
  },
  {
    key: 'copyrightvideo-ctm',
    name: 'CTM Copyright Video',
    domain: 'copyrightvideo.controlthemarket.com',
    adminUrl: null,
    healthUrl: null,
    revenue: null,
    // Confirmed by exhaustive repo search (2026-07-12): this subdomain/feature does not exist
    // anywhere in the codebase — no route, config, DNS/Caddy entry, or doc reference. Listed
    // here (rather than silently dropped) so it's visibly flagged as undefined scope pending
    // product decision, not missed.
    notDeployed: true,
  },
];

async function fetchJson(url, headers, timeoutMs = HEALTH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal, headers });
    if (!resp.ok) return { ok: false, status: resp.status };
    return { ok: true, body: await resp.json() };
  } finally {
    clearTimeout(timer);
  }
}

async function probeHealth(entry) {
  if (entry.notDeployed) return { status: 'not_deployed', latencyMs: null, version: null };
  if (!entry.healthUrl) return { status: 'not_configured', latencyMs: null, version: null };
  const started = Date.now();
  try {
    const { ok, body } = await fetchJson(entry.healthUrl);
    const latencyMs = Date.now() - started;
    if (!ok) return { status: 'down', latencyMs, version: null };
    return {
      status: 'online',
      latencyMs,
      version: body?.version ?? null,
      lastDeploy: body?.timestamp ?? body?.deployedAt ?? null,
    };
  } catch {
    return { status: 'unreachable', latencyMs: Date.now() - started, version: null };
  }
}

async function listPlatforms() {
  return Promise.all(
    REGISTRY.map(async (entry) => ({
      key: entry.key,
      name: entry.name,
      domain: entry.domain,
      adminUrl: entry.adminUrl,
      hasRevenueSource: Boolean(entry.revenue),
      ...(await probeHealth(entry)),
    })),
  );
}

// Each platform's real endpoint shape differs — normalize honestly (only fields that
// genuinely exist in the response), never backfill a metric with an invented number.
async function fetchCtmRevenue(entry, callerBearer) {
  if (!callerBearer) return { available: false, reason: 'no_caller_token' };
  try {
    const [metrics, sources] = await Promise.all([
      fetchJson(`${entry.revenue.baseUrl}/v1/revenue/metrics`, { Authorization: callerBearer }),
      fetchJson(`${entry.revenue.baseUrl}/v1/revenue/sources`, { Authorization: callerBearer }),
    ]);
    if (!metrics.ok) return { available: false, reason: `http_${metrics.status}` };
    const series = metrics.body?.data ?? metrics.body ?? [];
    const latest = Array.isArray(series) && series.length ? series[series.length - 1] : null;
    return {
      available: true,
      data: {
        mrr: latest?.mrr ?? null,
        newSubscriptions: latest?.newSubscriptions ?? null,
        churn: latest?.churn ?? null,
        sourceBreakdown: sources.ok ? (sources.body?.data ?? sources.body) : null,
      },
    };
  } catch (err) {
    return { available: false, reason: err.name === 'AbortError' ? 'timeout' : 'error' };
  }
}

async function fetchProxyRevenue(entry) {
  const token = process.env[entry.revenue.tokenEnv];
  if (!token) return { available: false, reason: 'not_configured' };
  try {
    const { ok, status, body } = await fetchJson(
      `${entry.revenue.baseUrl}/v1/admin/revenue/summary`,
      { Authorization: `Bearer ${token}` },
    );
    if (!ok) return { available: false, reason: `http_${status}` };
    const data = body?.data ?? body;
    return {
      available: true,
      data: {
        mrr: data.mrr ?? null,
        arr: data.arr ?? null,
        customers: data.customers ?? null,
        lifetimeRevenue: data.lifetimeRevenue ?? null,
        arpu: data.arpu ?? null,
      },
    };
  } catch (err) {
    return { available: false, reason: err.name === 'AbortError' ? 'timeout' : 'error' };
  }
}

async function fetchRevenue(entry, callerBearer) {
  if (!entry.revenue) return { key: entry.key, name: entry.name, available: false, reason: 'no_source' };
  const result = entry.revenue.type === 'ctm'
    ? await fetchCtmRevenue(entry, callerBearer)
    : await fetchProxyRevenue(entry);
  return { key: entry.key, name: entry.name, ...result };
}

async function getRevenueRollup(callerBearer) {
  const [perPlatform, baalvionKpis] = await Promise.all([
    Promise.all(REGISTRY.map((entry) => fetchRevenue(entry, callerBearer))),
    analyticsService.getKpis('30d').catch(() => null),
  ]);

  const baalvion = baalvionKpis
    ? {
        key: 'baalvion-core',
        name: 'Baalvion Platform (Commerce)',
        available: true,
        data: {
          mrr: baalvionKpis.monthlyRevenue ?? null,
          customers: baalvionKpis.totalOrgs ?? null,
          activeSubscriptions: baalvionKpis.activeSubscriptions ?? null,
          revenueGrowth: baalvionKpis.revenueGrowth ?? null,
        },
      }
    : { key: 'baalvion-core', name: 'Baalvion Platform (Commerce)', available: false, reason: 'error' };

  return { platforms: [baalvion, ...perPlatform] };
}

module.exports = { REGISTRY, listPlatforms, getRevenueRollup };
