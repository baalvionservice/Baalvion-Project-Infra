'use strict';
/**
 * Phase 6E-6.6 STEP 8 — burn-in final report. READ-ONLY (except --snapshot which writes one
 * metric snapshot to Redis).
 *
 * Reports:
 *   burn_in_started_at / burn_in_duration_hours
 *   total_authenticated_requests / rs256_adoption_rate
 *   hs256Share_final / mismatchRate_final / tenantDrift_final / orphanSessionRate_final
 *   SYSTEM_RISK_SCORE_final / session_anomalies_count
 *   stability_window_met (metrics stable for ≥ 6 consecutive hourly snapshots)
 *   thresholds_met / failure_flags
 *   rollback_required / ready_for_6E7 / verdict
 *
 * Usage:
 *   NODE_PATH=<auth-service/node_modules> node scripts/burnInReport.js
 *   NODE_PATH=<auth-service/node_modules> node scripts/burnInReport.js --snapshot
 *
 * --snapshot: take a fresh metric snapshot THEN produce the report.
 *   Run this command hourly (e.g. via task scheduler / cron) during the burn-in window.
 */
// Load .env so BURN_IN_MODE and Redis vars are available when run as a standalone script.
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

const authTrace = require('../observability/authTrace');
const burnIn    = require('../observability/burnIn');
const { analyze } = require('./authConsistencyCheck');

// 6E-7 readiness gate thresholds (must ALL be met for ready_for_6E7=true)
const THRESHOLDS = {
  hs256Share:       { max: 0.20,  label: 'island HS256 share must be < 20%'  },
  mismatchRate:     { max: 0.05,  label: 'identity mismatch rate must be < 5%' },
  tenantDrift:      { max: 0.05,  label: 'tenant drift rate must be < 5%'    },
  SYSTEM_RISK_SCORE:{ max: 20,    label: 'SYSTEM_RISK_SCORE must be < 20'    },
  orphanSessionRate:{ max: 0.01,  label: 'orphan session rate must be < 1%'  },
  rs256Adoption:    { min: 0.80,  label: 'RS256 adoption must be ≥ 80%'      },
};
const STABILITY_SNAPSHOTS = 6;  // need ≥ 6 hourly snapshots all below threshold
const MIN_HOURS     = 24;
const MIN_REQUESTS  = 10_000;

// Inject redis lazily (same pattern as authTrace for Windows path compat)
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

function checkThresholds(metrics) {
  const met = {}, flags = [];
  const { hs256Share, mismatchRate, tenantDrift, SYSTEM_RISK_SCORE, orphanSessionRate, rs256Adoption } = metrics;

  met.hs256Share        = hs256Share <= THRESHOLDS.hs256Share.max;
  met.mismatchRate      = mismatchRate <= THRESHOLDS.mismatchRate.max;
  met.tenantDrift       = tenantDrift <= THRESHOLDS.tenantDrift.max;
  met.SYSTEM_RISK_SCORE = SYSTEM_RISK_SCORE <= THRESHOLDS.SYSTEM_RISK_SCORE.max;
  met.orphanSessionRate = orphanSessionRate <= THRESHOLDS.orphanSessionRate.max;
  met.rs256Adoption     = rs256Adoption >= THRESHOLDS.rs256Adoption.min;

  for (const k in met) {
    if (!met[k]) {
      const t = THRESHOLDS[k];
      const actual = metrics[k];
      const bound = t.max != null ? `${actual.toFixed(4)} >= ${t.max}` : `${actual.toFixed(4)} < ${t.min}`;
      flags.push(`${k}:${bound} — ${t.label}`);
    }
  }
  return { met, flags };
}

function checkStability(snapshots) {
  // snapshots array is newest-first (from Redis LRANGE 0 STABILITY_SNAPSHOTS-1)
  if (snapshots.length < STABILITY_SNAPSHOTS) return { stable: false, reason: `only ${snapshots.length}/${STABILITY_SNAPSHOTS} hourly snapshots available — run --snapshot hourly` };
  const window = snapshots.slice(0, STABILITY_SNAPSHOTS);
  const newest = window[0], oldest = window[STABILITY_SNAPSHOTS - 1];

  // Check all snapshots in window are below threshold
  for (const s of window) {
    const { hs256Share, mismatchRate, tenantDrift, score } = s;
    if (hs256Share > THRESHOLDS.hs256Share.max) return { stable: false, reason: `hs256Share=${hs256Share} above threshold in window at ${s.ts}` };
    if (mismatchRate > THRESHOLDS.mismatchRate.max) return { stable: false, reason: `mismatchRate=${mismatchRate} above threshold in window at ${s.ts}` };
    if (tenantDrift > THRESHOLDS.tenantDrift.max) return { stable: false, reason: `tenantDrift=${tenantDrift} above threshold in window at ${s.ts}` };
    if (score > THRESHOLDS.SYSTEM_RISK_SCORE.max) return { stable: false, reason: `SYSTEM_RISK_SCORE=${score} above threshold in window at ${s.ts}` };
  }

  // No upward trend: newest metric must not be worse than oldest (declining or flat)
  const drifted = [];
  if (newest.hs256Share    > oldest.hs256Share   ) drifted.push('hs256Share');
  if (newest.mismatchRate  > oldest.mismatchRate ) drifted.push('mismatchRate');
  if (newest.tenantDrift   > oldest.tenantDrift  ) drifted.push('tenantDrift');
  if (newest.score         > oldest.score        ) drifted.push('SYSTEM_RISK_SCORE');
  if (drifted.length) return { stable: false, reason: `upward drift detected in: ${drifted.join(', ')}` };

  return { stable: true, reason: `all ${STABILITY_SNAPSHOTS} snapshots below threshold with no upward drift` };
}

(async () => {
  const SNAPSHOT_MODE = process.argv.includes('--snapshot') || process.argv.includes('--final');
  const FINAL_MODE    = process.argv.includes('--final');
  const r = getRedis();
  if (!r) { console.error('burnInReport: Redis unavailable'); process.exit(1); }

  // --snapshot: take a fresh snapshot first (pass Redis client directly — no need for init())
  if (SNAPSHOT_MODE) {
    const snap = await burnIn.takeSnapshot(r);
    if (!snap) { console.error('burnInReport --snapshot: snapshot failed (check Redis + authTrace keys)'); process.exit(1); }
    console.error('[burn-in] snapshot taken:', snap.ts);
  }

  // ---- gather data ----
  const startedAt = await r.get('auth:burnin:started_at');
  const anomalyCount = Number((await r.get('auth:burnin:anomaly_count')) || 0);
  const snapshotsRaw = await r.lrange('auth:burnin:snapshots', 0, STABILITY_SNAPSHOTS + 1);
  const snapshots = snapshotsRaw.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);

  const counters = await authTrace.getAllCounters('production');
  const events   = await authTrace.getRecentRedis(2000, 'production');
  const consistency = analyze(events);

  // Aggregate counters
  let totalAccept = 0, totalRequests = 0, rs256Accept = 0, islandTotal = 0, islandHs = 0;
  for (const svc in counters) {
    const c = counters[svc];
    totalRequests += c.total   || 0;
    totalAccept   += c.accept  || 0;
    rs256Accept   += (c.src_gateway || 0) + (c.src_auth_service || 0);
    if (svc !== 'auth-gateway') {
      islandTotal += c.total || 0;
      islandHs    += c.src_island_hs256 || 0;
    }
  }

  const hs256Share     = islandTotal ? +(islandHs / islandTotal).toFixed(4) : 0;
  const rs256Adoption  = totalAccept ? +(rs256Accept / totalAccept).toFixed(4) : 0;
  const orphanRate     = consistency.usersObserved
    ? +(consistency.orphanSessions.length / consistency.usersObserved).toFixed(4) : 0;
  const score = burnIn.computeScore(hs256Share, consistency.mismatchRate, consistency.driftRate, consistency.tenantMismatchRate);

  const durationHours  = startedAt ? +((Date.now() - new Date(startedAt).getTime()) / 3_600_000).toFixed(2) : null;
  const minimumWindowMet = (durationHours != null && durationHours >= MIN_HOURS) || totalAccept >= MIN_REQUESTS;

  const metrics = {
    hs256Share,
    mismatchRate: consistency.mismatchRate,
    tenantDrift: consistency.tenantMismatchRate,
    SYSTEM_RISK_SCORE: score,
    orphanSessionRate: orphanRate,
    rs256Adoption,
  };

  const { met: thresholdsMet, flags: failureFlags } = checkThresholds(metrics);
  const stability = checkStability(snapshots);
  const allThresholdsMet = Object.values(thresholdsMet).every(Boolean);
  const readyFor6E7 = minimumWindowMet && allThresholdsMet && stability.stable;

  // Per STEP 7: if score > 25 or mismatchRate > 0.10 or login failure > 2% → extend window
  // Login failure rate = /auth/login 401s ÷ all /auth/login attempts (not all gateway rejects).
  // Approximated from the reject counter on the gateway leg only, excluding anonymous (unauthed) traffic.
  const gwCounters = counters['auth-gateway'] || {};
  const gwReject = gwCounters.reject || 0, gwAccept = gwCounters.accept || 0;
  // Exclude anonymous from denominator — anonymous requests aren't login attempts.
  const gwAnonymous = gwCounters.anonymous || 0;
  const loginAttempts = gwAccept + gwReject;
  const loginFailureRate = loginAttempts ? +(gwReject / loginAttempts).toFixed(4) : 0;
  const step7Violations = [];
  if (score > 25) step7Violations.push(`SYSTEM_RISK_SCORE=${score} > 25 → EXTEND_WINDOW`);
  if (consistency.mismatchRate > 0.10) step7Violations.push(`mismatchRate=${consistency.mismatchRate} > 0.10 → EXTEND_WINDOW`);
  if (loginFailureRate > 0.02) step7Violations.push(`loginFailureRate=${loginFailureRate} > 0.02 → EXTEND_WINDOW`);

  const verdict = readyFor6E7 ? 'READY' : (step7Violations.length ? 'EXTEND_WINDOW' : 'NOT_YET');
  const band = (s) => (s < 20 ? 'LOW' : s < 60 ? 'MEDIUM' : 'HIGH');

  const report = {
    tool: 'burnInReport',
    readOnly: !SNAPSHOT_MODE,
    phase: FINAL_MODE ? '6E-7-pre-cutover' : '6E-6.6',
    burn_in_mode: process.env.BURN_IN_MODE || 'true',
    burn_in_started_at: startedAt,
    burn_in_duration_hours: durationHours,
    minimum_window_met: minimumWindowMet,
    minimum_window_requirement: `${MIN_HOURS}h OR ${MIN_REQUESTS.toLocaleString()} authenticated requests`,
    total_authenticated_requests: totalAccept,
    total_all_requests: totalRequests,
    login_failure_rate: loginFailureRate,
    rs256_adoption_rate: rs256Adoption,
    hs256Share_final: hs256Share,
    mismatchRate_final: consistency.mismatchRate,
    tenantDrift_final: consistency.tenantMismatchRate,
    orphanSessionRate_final: orphanRate,
    SYSTEM_RISK_SCORE_final: score,
    risk_band: band(score),
    session_anomalies_count: anomalyCount,
    stability_window_met: stability.stable,
    stability_reason: stability.reason,
    stability_snapshots_available: snapshots.length,
    stability_snapshots_required: STABILITY_SNAPSHOTS,
    thresholds_met: thresholdsMet,
    failure_flags: failureFlags,
    step7_violations: step7Violations,
    rollback_required: false,       // burn-in never mandates rollback — only extends window
    ready_for_6E7: readyFor6E7,
    verdict,
    verdict_key: {
      READY:         'All thresholds met + 6h stability confirmed — Phase 6E-7 safe to proceed',
      NOT_YET:       'Thresholds not yet met — continue burn-in window, no action required',
      EXTEND_WINDOW: 'STEP 7 violation detected — extend burn-in, do not retire HS256',
    }[verdict],
  };

  console.log(JSON.stringify(report, null, 2));

  // --final: persist the report as an immutable audit record.
  if (FINAL_MODE) {
    const outDir = path.join(__dirname, '../../../../auth-migration');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'final-burnin-report.json');
    const finalRecord = { generated_at: new Date().toISOString(), ...JSON.parse(JSON.stringify(report)) };
    fs.writeFileSync(outFile, JSON.stringify(finalRecord, null, 2));
    console.error('[burn-in] final report written →', outFile);
  }

  await r.quit();
  process.exit(0);
})().catch((e) => { console.error('burnInReport error:', e.message); process.exit(1); });
