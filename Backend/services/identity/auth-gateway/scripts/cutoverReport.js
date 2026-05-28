'use strict';
/**
 * Phase 6E-7 STEP 10 — post-cutover final report. READ-ONLY.
 *
 * Evaluates whether the HS256 retirement cutover succeeded, is in progress (PARTIAL),
 * or must be aborted (ABORTED) based on live production metrics + env state.
 *
 * Fields:
 *   hs256_active_sessions      — bff:session:* keys without gateway_issued:true
 *   gateway_issued_sessions    — bff:session:* keys with gateway_issued:true
 *   hs256_issuance_enabled     — true if HS256_ISSUANCE_ENABLED != 'false'
 *   rs256_adoption_rate        — RS256 accept / total accept
 *   gateway_enforced_pct       — gateway-identity requests / all island requests (%)
 *   SYSTEM_RISK_SCORE          — live score from production stream
 *   mismatchRate_final         — identity mismatch rate (production stream)
 *   tenantDrift_final          — tenant drift rate (production stream)
 *   login_failure_rate         — gateway-level 401s / (accept + 401s)
 *   rollback_available         — rollbackCutover.js present in scripts/
 *   FINAL_STATUS               — SUCCESS | PARTIAL | ABORTED
 *
 * FINAL_STATUS rules:
 *   ABORTED  → SYSTEM_RISK_SCORE ≥ 60 OR login_failure_rate > 0.05
 *   SUCCESS  → issuance disabled + hs256Share < 0.05 + rs256Adoption ≥ 0.80 + score < 20 + mismatchRate < 0.05
 *   PARTIAL  → issuance disabled but SUCCESS criteria not yet fully met (sessions draining normally)
 *   NOT_YET  → HS256_ISSUANCE_ENABLED still true (cutover not activated)
 *
 * Usage:
 *   node scripts/cutoverReport.js
 */
(function loadEnv() {
  const p = require('path').join(__dirname, '../.env');
  try { require('dotenv').config({ path: p }); return; } catch { /* dotenv not installed — fall through */ }
  try {
    require('fs').readFileSync(p, 'utf8').split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  } catch { /* .env optional */ }
})();

const fs   = require('fs');
const path = require('path');

const authTrace  = require('../observability/authTrace');
const burnIn     = require('../observability/burnIn');
const { analyze } = require('./authConsistencyCheck');

// Inject redis lazily (Windows path compat — same pattern as burnInReport.js)
let _redis;
function getRedis() {
  if (_redis !== undefined) return _redis;
  let M;
  try { M = require('ioredis'); }
  catch {
    try { M = require(process.env.IOREDIS_PATH || 'd:/Baalvion Projects/Backend/services/identity/auth-service/node_modules/ioredis'); }
    catch { _redis = null; return _redis; }
  }
  try {
    const Redis = M.default || M;
    _redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 2,
    });
    _redis.on('error', () => {});
  } catch { _redis = null; }
  return _redis;
}

async function countSessions(r) {
  const keys = await r.keys('bff:session:*');
  const sources = keys.filter((k) => !k.includes(':shadow:'));
  let gatewayIssued = 0, legacyHs = 0, unannotated = 0;

  for (const k of sources) {
    const raw = await r.get(k);
    if (!raw) continue;
    let s;
    try { s = JSON.parse(raw); } catch { continue; }
    if (s.gateway_issued === true) { gatewayIssued++; continue; }
    if (s.legacy_auth === true) { legacyHs++; continue; }
    unannotated++;
  }
  return { total: sources.length, gateway_issued: gatewayIssued, legacy_auth: legacyHs, unannotated, hs256_active: legacyHs + unannotated };
}

(async () => {
  const r = getRedis();
  if (!r) { console.error('cutoverReport: Redis unavailable'); process.exit(1); }

  // ---- session inventory ----
  const sessions = await countSessions(r);

  // ---- production stream metrics ----
  const counters = await authTrace.getAllCounters('production');
  const events   = await authTrace.getRecentRedis(2000, 'production');
  const consistency = analyze(events);

  let totalAccept = 0, totalRequests = 0, rs256Accept = 0;
  let islandTotal = 0, islandHs = 0, islandGw = 0;
  for (const svc in counters) {
    const c = counters[svc];
    totalRequests += c.total   || 0;
    totalAccept   += c.accept  || 0;
    rs256Accept   += (c.src_gateway || 0) + (c.src_auth_service || 0);
    if (svc !== 'auth-gateway') {
      islandTotal += c.total  || 0;
      islandHs    += c.src_island_hs256 || 0;
      islandGw    += c.src_gateway      || 0;
    }
  }

  const hs256Share      = islandTotal ? +(islandHs / islandTotal).toFixed(4) : 0;
  const rs256Adoption   = totalAccept  ? +(rs256Accept / totalAccept).toFixed(4) : 0;
  const gatewayEnforcedPct = islandTotal ? +(100 * islandGw / islandTotal).toFixed(1) : 0;
  const score = burnIn.computeScore(hs256Share, consistency.mismatchRate, consistency.driftRate, consistency.tenantMismatchRate);
  const band  = (s) => (s < 20 ? 'LOW' : s < 60 ? 'MEDIUM' : 'HIGH');

  const gwCounters  = counters['auth-gateway'] || {};
  const gwReject    = gwCounters.reject || 0;
  const gwAccept    = gwCounters.accept || 0;
  const loginAttempts = gwAccept + gwReject;
  const loginFailureRate = loginAttempts ? +(gwReject / loginAttempts).toFixed(4) : 0;

  // ---- env state ----
  const issuanceEnabled = process.env.HS256_ISSUANCE_ENABLED !== 'false';
  const islandAuthMode  = process.env.ISLAND_AUTH_MODE || 'hybrid';
  const bffMode         = process.env.BFF_ENFORCEMENT_MODE || 'hybrid';
  const burnInMode      = process.env.BURN_IN_MODE || 'false';

  // ---- rollback available? ----
  const rollbackScript  = path.join(__dirname, 'rollbackCutover.js');
  const rollbackAvailable = fs.existsSync(rollbackScript);

  // ---- FINAL_STATUS ----
  const aborted = score >= 60 || loginFailureRate > 0.05;
  const success = !issuanceEnabled
    && hs256Share < 0.05
    && rs256Adoption >= 0.80
    && score < 20
    && consistency.mismatchRate < 0.05;

  let FINAL_STATUS;
  if (aborted) {
    FINAL_STATUS = 'ABORTED';
  } else if (success) {
    FINAL_STATUS = 'SUCCESS';
  } else if (!issuanceEnabled) {
    FINAL_STATUS = 'PARTIAL';
  } else {
    FINAL_STATUS = 'NOT_YET';
  }

  const report = {
    tool: 'cutoverReport',
    readOnly: true,
    phase: '6E-7',
    generated_at: new Date().toISOString(),

    env_state: {
      HS256_ISSUANCE_ENABLED: issuanceEnabled,
      ISLAND_AUTH_MODE: islandAuthMode,
      BFF_ENFORCEMENT_MODE: bffMode,
      BURN_IN_MODE: burnInMode,
    },

    session_inventory: {
      total_bff_sessions: sessions.total,
      gateway_issued_sessions: sessions.gateway_issued,
      hs256_active_sessions: sessions.hs256_active,
      legacy_auth_annotated: sessions.legacy_auth,
      unannotated_legacy: sessions.unannotated,
      hs256_session_note: sessions.unannotated > 0
        ? 'Run legacySessionAnnotator.js --apply to annotate remaining sessions'
        : 'All legacy sessions annotated',
    },

    traffic_metrics: {
      total_requests: totalRequests,
      total_authenticated: totalAccept,
      rs256_adoption_rate: rs256Adoption,
      hs256_share_island: hs256Share,
      gateway_enforced_pct: gatewayEnforcedPct,
      login_failure_rate: loginFailureRate,
    },

    risk_metrics: {
      SYSTEM_RISK_SCORE: score,
      risk_band: band(score),
      mismatchRate_final: consistency.mismatchRate,
      tenantDrift_final: consistency.tenantMismatchRate,
      driftRate_final: consistency.driftRate,
    },

    hs256_issuance_enabled: issuanceEnabled,
    rs256_adoption_rate: rs256Adoption,
    gateway_enforced_pct: gatewayEnforcedPct,
    SYSTEM_RISK_SCORE: score,
    mismatchRate_final: consistency.mismatchRate,
    tenantDrift_final: consistency.tenantMismatchRate,
    login_failure_rate: loginFailureRate,
    rollback_available: rollbackAvailable,

    FINAL_STATUS,
    status_key: {
      SUCCESS:  'HS256 issuance disabled, active sessions < 5%, RS256 adoption ≥ 80%, risk score < 20 — cutover complete',
      PARTIAL:  'HS256 issuance disabled — existing sessions still draining; monitor until hs256_active_sessions → 0',
      ABORTED:  'Critical threshold exceeded (risk score ≥ 60 or login failure rate > 5%) — run rollbackCutover.js',
      NOT_YET:  'HS256_ISSUANCE_ENABLED still true — cutover not yet activated',
    }[FINAL_STATUS],

    next_steps: FINAL_STATUS === 'ABORTED'
      ? ['IMMEDIATE: node scripts/rollbackCutover.js --verify', 'Set ISLAND_AUTH_MODE=hybrid + BFF_ENFORCEMENT_MODE=hybrid + HS256_ISSUANCE_ENABLED=true on all services', 'Restart all services', 'Investigate risk elevation before retrying cutover']
      : FINAL_STATUS === 'SUCCESS'
      ? ['Phase 6E-7 complete — HS256 retirement confirmed', 'Continue monitoring hs256_active_sessions until it reaches 0', 'Next: schedule HS256 library removal from jwtserver.js (separate phase)']
      : FINAL_STATUS === 'PARTIAL'
      ? ['Monitor hs256_active_sessions — sessions drain as users re-authenticate', 'Run node scripts/legacySessionAnnotator.js --apply if unannotated_legacy > 0', 'Re-run cutoverReport.js hourly until FINAL_STATUS=SUCCESS']
      : ['Set HS256_ISSUANCE_ENABLED=false + ISLAND_AUTH_MODE=rs256_only + BFF_ENFORCEMENT_MODE=strict on all services', 'Restart all services, then re-run cutoverReport.js'],
  };

  console.log(JSON.stringify(report, null, 2));
  await r.quit();
  process.exit(0);
})().catch((e) => { console.error('cutoverReport error:', e.message); process.exit(1); });
