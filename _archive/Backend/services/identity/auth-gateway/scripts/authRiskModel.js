'use strict';
/**
 * Phase 6E-6 STEP 6 — auth risk model. READ-ONLY. Aggregates observed traffic into one
 * SYSTEM_RISK_SCORE (0–100) = the risk of retiring HS256 / cutting over to gateway-only NOW.
 *
 *   higher score → riskier (more HS256 dependence + more identity/role/tenant drift).
 *   score = 100 · ( 0.50·hs256Share + 0.25·mismatchRate + 0.15·driftRate + 0.10·tenantMismatchRate )
 *
 * Inputs: Redis counters auth:trace:counters:<svc> (traffic mix) + auth:trace:recent (drift, via the
 * STEP-2 analyzer). hs256Share is measured over ISLAND traffic only (the gateway leg is always RS256).
 */
const authTrace = require('../observability/authTrace');
const { analyze } = require('./authConsistencyCheck');

const band = (s) => (s < 25 ? 'LOW' : s < 60 ? 'MEDIUM' : 'HIGH');

(async () => {
  const counters = await authTrace.getAllCounters('production');
  const events = await authTrace.getRecentRedis(2000, 'production');

  let total = 0, gw = 0, hs = 0, as = 0, anon = 0, strictWould = 0;
  let islandTotal = 0, islandHs = 0, islandGw = 0;
  for (const svc in counters) {
    const c = counters[svc];
    total += c.total || 0; gw += c.src_gateway || 0; hs += c.src_island_hs256 || 0;
    as += c.src_auth_service || 0; anon += c.src_anonymous || 0; strictWould += c.strict_would_reject || 0;
    if (svc !== 'auth-gateway') { islandTotal += c.total || 0; islandHs += c.src_island_hs256 || 0; islandGw += c.src_gateway || 0; }
  }
  const pct = (n, d) => (d ? +(100 * n / d).toFixed(1) : 0);
  const consistency = analyze(events);

  const hs256Share = islandTotal ? islandHs / islandTotal : 0;
  const score = Math.round(Math.min(100, 100 * (
    0.50 * hs256Share +
    0.25 * consistency.mismatchRate +
    0.15 * consistency.driftRate +
    0.10 * consistency.tenantMismatchRate
  )));

  console.log(JSON.stringify({
    tool: 'authRiskModel', readOnly: true,
    traffic: {
      totalRequests: total,
      pct_gateway_identity: pct(gw, total),
      pct_hs256: pct(hs, total),
      pct_auth_service: pct(as, total),
      pct_anonymous: pct(anon, total),
    },
    islandTraffic: { total: islandTotal, viaGateway: islandGw, viaHs256: islandHs, hs256Share: +hs256Share.toFixed(4) },
    consistency: {
      usersComparedBothSources: consistency.comparedBothSources,
      identityMismatchRate: consistency.mismatchRate,
      roleDriftRate: consistency.driftRate,
      tenantMismatchRate: consistency.tenantMismatchRate,
      orphanSessions: consistency.orphanSessions.length,
    },
    strictWouldRejectEvents: strictWould,
    SYSTEM_RISK_SCORE: score,
    risk_band: band(score),
    interpretation: '0 = safe to retire HS256 now (all-gateway, no drift); 100 = high lockout/drift risk',
  }, null, 2));
  process.exit(0);
})().catch((e) => { console.error('authRiskModel error:', e.message); process.exit(1); });
