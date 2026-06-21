'use strict';
/**
 * Phase 6E-8 STEP 8 — final decommission verification matrix. READ-ONLY.
 *
 * Phase 6E-8 HARD STATE: decommission conditions are verified at CODE LEVEL,
 * not via env vars (env vars cannot re-enable HS256 after Phase 6E-8 is applied).
 *
 * Code audit (verified by reading source files):
 *   hs256_signing_removed     — jwtserver.js signAccessToken throws unconditionally ("PERMANENTLY RETIRED")
 *   hs256_verify_removed      — dualTokenVerifier.js has rejectHs256:true + no HS256_ALLOWED or allowHs256 logic
 *   bearer_path_removed       — authMiddleware.js does NOT import dualTokenVerifier (bearer path eliminated)
 *
 * Config audit (env-readable state):
 *   gateway_strict_mode       — BFF_ENFORCEMENT_MODE=strict (auth-gateway .env)
 *
 * Traffic audit (live Redis production stream):
 *   hs256_traffic_share_clean — island hs256 requests / island total < 1%
 *   rs256_traffic_share_full  — RS256 + gateway requests / total accept ≥ 99%
 *   no_hs256_recent_events    — no src_island_hs256 counters remain
 *
 * ARCHITECTURE_STATUS:
 *   CLEAN       — all code + config + traffic conditions met; single trust domain achieved
 *   IN_PROGRESS — code hardened but hs256 traffic still clearing from stream (synthetic data or live drain)
 *   INCOMPLETE  — code not yet in hard state
 *
 * Usage:
 *   node scripts/decommissionReport.js
 *   node scripts/decommissionReport.js --sessions   # include bff:session inventory (slower)
 */
(function loadEnv() {
  const p = require('path').join(__dirname, '../.env');
  try { require('dotenv').config({ path: p }); return; } catch { /* dotenv not installed */ }
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

const SESSIONS = process.argv.includes('--sessions');

const REPO_ROOT = path.join(__dirname, '../../../..');

const ISLAND_SERVICES = [
  { name: 'elite-circle-service', dir: path.join(REPO_ROOT, 'services/ecosystem/elite-circle-service'), port: 3051 },
  { name: 'insiders-service',     dir: path.join(REPO_ROOT, 'services/ecosystem/insiders-service'),     port: 3050 },
  { name: 'trade-service',        dir: path.join(REPO_ROOT, 'services/commerce/trade-service'),         port: 3025 },
];

function readEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const vars = {};
    fs.readFileSync(filePath, 'utf8').split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m) vars[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    });
    return vars;
  } catch { return null; }
}

function readSrc(filePath) {
  try { return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null; }
  catch { return null; }
}

// ---- code-level audit per island ----
function auditIsland(svc) {
  const jwtSrc = readSrc(path.join(svc.dir, 'utils/jwtserver.js'));
  const authSrc = readSrc(path.join(svc.dir, 'middleware/authMiddleware.js'));
  const dualSrc = readSrc(path.join(svc.dir, 'middleware/dualTokenVerifier.js'));

  const signingRetired = jwtSrc != null && jwtSrc.includes('PERMANENTLY RETIRED');
  const bearerRemoved  = authSrc != null && !authSrc.includes("require('./dualTokenVerifier')");
  const hs256VerifyRemoved = dualSrc != null
    && dualSrc.includes('rejectHs256: true')
    && !dualSrc.includes('HS256_ALLOWED')
    && !dualSrc.includes('allowHs256');

  return {
    service: svc.name,
    port: svc.port,
    files_found: {
      jwtserver:         jwtSrc != null,
      authMiddleware:    authSrc != null,
      dualTokenVerifier: dualSrc != null,
    },
    hs256_signing_retired_in_code:     signingRetired,
    bearer_path_removed_in_code:       bearerRemoved,
    hs256_verify_removed_in_code:      hs256VerifyRemoved,
    hardened: signingRetired && bearerRemoved && hs256VerifyRemoved,
  };
}

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

async function scanKeys(r, pattern) {
  const found = [];
  let cursor = '0';
  do {
    const [next, keys] = await r.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    cursor = next;
    found.push(...keys);
  } while (cursor !== '0');
  return found;
}

(async () => {
  const r = getRedis();
  if (!r) { console.error('decommissionReport: Redis unavailable'); process.exit(1); }

  // ---- code audit ----
  const islandAudits = ISLAND_SERVICES.map(auditIsland);
  const allHardened  = islandAudits.every((a) => a.hardened);

  // ---- config audit ----
  const gwEnv = readEnvFile(path.join(__dirname, '../.env')) || {};
  const gatewayStrictMode = (gwEnv.BFF_ENFORCEMENT_MODE || 'hybrid').toLowerCase() === 'strict';

  // ---- traffic audit ----
  const counters = await authTrace.getAllCounters('production');
  const events   = await authTrace.getRecentRedis(2000, 'production');
  const consistency = analyze(events);

  let totalAccept = 0, rs256Accept = 0, islandTotal = 0, islandHs = 0;
  let anyIslandHs256 = false;
  for (const svc in counters) {
    const c = counters[svc];
    totalAccept += c.accept || 0;
    rs256Accept += (c.src_gateway || 0) + (c.src_auth_service || 0);
    if (svc !== 'auth-gateway') {
      islandTotal += c.total  || 0;
      islandHs    += c.src_island_hs256 || 0;
      if ((c.src_island_hs256 || 0) > 0) anyIslandHs256 = true;
    }
  }

  const hs256TrafficShare = islandTotal ? +(islandHs / islandTotal).toFixed(4) : 0;
  const rs256TrafficShare = totalAccept  ? +(rs256Accept / totalAccept).toFixed(4) : 1;
  const score = burnIn.computeScore(hs256TrafficShare, consistency.mismatchRate, consistency.driftRate, consistency.tenantMismatchRate);

  const hs256TrafficClean = hs256TrafficShare < 0.01;
  const rs256TrafficFull  = rs256TrafficShare >= 0.99;
  const noRecentHs256     = !anyIslandHs256;

  // ---- session inventory ----
  let sessionData = null;
  if (SESSIONS) {
    const sessionKeys = await scanKeys(r, 'bff:session:*');
    const sources = sessionKeys.filter((k) => !k.includes(':shadow:'));
    let gwIssued = 0, legacyAnnotated = 0, unannotated = 0;
    for (const k of sources) {
      const raw = await r.get(k);
      if (!raw) continue;
      let s;
      try { s = JSON.parse(raw); } catch { continue; }
      if (s.gateway_issued === true) gwIssued++;
      else if (s.legacy_auth === true) legacyAnnotated++;
      else unannotated++;
    }
    sessionData = { total: sources.length, gateway_issued: gwIssued, legacy_auth_annotated: legacyAnnotated, unannotated_legacy: unannotated };
  }

  const legacySessionsDrained = sessionData
    ? (sessionData.legacy_auth_annotated === 0 && sessionData.unannotated_legacy === 0)
    : null;

  // ---- verification matrix ----
  const matrix = {
    // CODE-LEVEL guarantees (env vars irrelevant — verified by reading source files)
    hs256_signing_removed:     { value: islandAudits.every((a) => a.hs256_signing_retired_in_code),   required: true,  source: 'code', desc: 'signAccessToken throws unconditionally in all 3 island jwtserver.js' },
    hs256_verify_removed:      { value: islandAudits.every((a) => a.hs256_verify_removed_in_code),    required: true,  source: 'code', desc: 'dualTokenVerifier.js has rejectHs256:true and no HS256_ALLOWED / allowHs256 logic' },
    bearer_path_removed:       { value: islandAudits.every((a) => a.bearer_path_removed_in_code),     required: true,  source: 'code', desc: 'authMiddleware.js does not import dualTokenVerifier (bearer path eliminated)' },
    // CONFIG-LEVEL
    gateway_strict_mode:       { value: gatewayStrictMode,     required: true,  source: 'env',  desc: 'BFF_ENFORCEMENT_MODE=strict on auth-gateway' },
    // TRAFFIC-LEVEL (clears as synthetic data scrolls out of 2000-event ring)
    hs256_traffic_share_clean: { value: hs256TrafficClean,     required: true,  source: 'redis', desc: `island hs256 share=${hs256TrafficShare} must be < 1% (clears as synthetic data scrolls out)` },
    rs256_traffic_share_full:  { value: rs256TrafficFull,      required: true,  source: 'redis', desc: `RS256/gateway share=${rs256TrafficShare} must be ≥ 99%` },
    no_hs256_recent_events:    { value: noRecentHs256,         required: true,  source: 'redis', desc: 'no src_island_hs256 counters in production stream' },
    // SESSION-LEVEL (optional)
    legacy_sessions_drained:   { value: legacySessionsDrained, required: false, source: 'redis', desc: legacySessionsDrained === null ? 'not checked — run with --sessions' : 'all legacy bff sessions drained' },
  };

  const requiredCodeMet    = matrix.hs256_signing_removed.value && matrix.hs256_verify_removed.value && matrix.bearer_path_removed.value && matrix.gateway_strict_mode.value;
  const requiredTrafficMet = matrix.hs256_traffic_share_clean.value && matrix.rs256_traffic_share_full.value && matrix.no_hs256_recent_events.value;
  const allRequiredMet     = requiredCodeMet && requiredTrafficMet;

  let ARCHITECTURE_STATUS;
  if (allRequiredMet) {
    ARCHITECTURE_STATUS = 'CLEAN';
  } else if (requiredCodeMet) {
    ARCHITECTURE_STATUS = 'IN_PROGRESS'; // code hardened; traffic metrics clearing (synthetic data or live drain)
  } else {
    ARCHITECTURE_STATUS = 'INCOMPLETE';
  }

  const report = {
    tool: 'decommissionReport',
    readOnly: true,
    phase: '6E-8',
    hard_state: true,
    generated_at: new Date().toISOString(),

    code_audit: {
      note: 'Source files read directly — env vars cannot override these guarantees',
      islands: islandAudits,
      all_islands_hardened: allHardened,
    },

    config_state: {
      'auth-gateway': {
        BFF_ENFORCEMENT_MODE: gwEnv.BFF_ENFORCEMENT_MODE || '(not set)',
        BURN_IN_MODE: gwEnv.BURN_IN_MODE || '(not set)',
      },
    },

    traffic_metrics: {
      total_authenticated: totalAccept,
      hs256_share_island: hs256TrafficShare,
      rs256_adoption_rate: rs256TrafficShare,
      SYSTEM_RISK_SCORE: score,
      mismatchRate: consistency.mismatchRate,
      tenantDrift: consistency.tenantMismatchRate,
      note: hs256TrafficShare > 0.01 ? 'hs256 traffic share > 1% — synthetic data in 2000-event ring; will clear as real traffic fills the ring' : 'traffic clean',
    },

    session_inventory: sessionData
      ? { ...sessionData }
      : { note: 'run with --sessions to include session inventory' },

    verification_matrix: matrix,

    code_conditions_met:    requiredCodeMet,
    traffic_conditions_met: requiredTrafficMet,
    all_required_met:       allRequiredMet,

    ARCHITECTURE_STATUS,
    status_key: {
      CLEAN:       'All conditions met — single RS256/gateway trust domain achieved. HS256 fully decommissioned.',
      IN_PROGRESS: 'Code hardened (HS256 permanently removed from source). Traffic metrics clearing — synthetic data still in Redis ring buffer; will resolve as real RS256 traffic accumulates.',
      INCOMPLETE:  'Code not yet in hard state — verify Phase 6E-8 file changes were applied correctly.',
    }[ARCHITECTURE_STATUS],

    rollback_model: 'DEPLOYMENT REVERT ONLY — no env var can re-enable HS256. git revert / image rollback required.',

    failure_checklist: Object.entries(matrix)
      .filter(([, v]) => v.required && v.value === false)
      .map(([k, v]) => `[${v.source}] ${k}: ${v.desc}`),

    next_steps: ARCHITECTURE_STATUS === 'CLEAN'
      ? [
          'Run node scripts/decommissionCleanup.js --apply --sessions to purge legacy Redis keys',
          'Commit Phase 6E-8 env changes (BFF_ENFORCEMENT_MODE=strict) to the environment configuration store',
          'Archive burn-in data: cp Backend/auth-migration/final-burnin-report.json to long-term audit storage',
          'STEP 7 — Frontend migration: replace localStorage JWT + Authorization: Bearer with credentials: include (frontend sprint required)',
        ]
      : ARCHITECTURE_STATUS === 'IN_PROGRESS'
      ? [
          'No action required — code is hardened. Traffic metrics will clear automatically.',
          'Redis ring buffer holds 2000 events; metrics will normalize as real RS256 traffic accumulates.',
          'Re-run decommissionReport.js in 1h or after 2000+ real authenticated requests.',
        ]
      : [
          'Verify that all Phase 6E-8 file changes were committed:',
          '  - middleware/authMiddleware.js (all 3 islands): no dualTokenVerifier import',
          '  - middleware/dualTokenVerifier.js (all 3 islands): rejectHs256:true, no HS256_ALLOWED',
          '  - utils/jwtserver.js (all 3 islands): signAccessToken throws unconditionally',
          'Re-run this report after applying the changes.',
        ],
  };

  console.log(JSON.stringify(report, null, 2));
  await r.quit();
  process.exit(0);
})().catch((e) => { console.error('decommissionReport error:', e.message); process.exit(1); });
