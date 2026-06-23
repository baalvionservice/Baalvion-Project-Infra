'use strict';
/**
 * Phase 6E-6.6 — burn-in mode tracker. Activated by BURN_IN_MODE=true in env.
 * PURE OBSERVATION: fail-open, never blocks traffic, no auth-side effects.
 *
 * Responsibilities:
 *   1. Record burn-in start timestamp (auth:burnin:started_at — set once, never overwritten)
 *   2. Per-request session anomaly detection — real-time identity drift detection, LOG ONLY
 *   3. Hourly metric snapshot recorder (auth:burnin:snapshots) for 6-hour stability analysis
 *
 * Redis keys:
 *   auth:burnin:started_at     ISO string — when burn-in first started (setnx — never overwritten)
 *   auth:burnin:snapshots      LPUSH JSON — hourly metric snapshots (capped at SNAPSHOT_CAP)
 *   auth:burnin:anomalies      LPUSH JSON — session anomaly events (capped at ANOMALY_CAP)
 *   auth:burnin:anomaly_count  INCR — total anomaly events ever detected
 *
 * Anomaly detection: per-request LRU identity cache (bounded to CACHE_MAX entries). If the same
 * userId is seen with a different orgId in the same session, it's logged as an identity-drift anomaly.
 * LOG ONLY — no request rejection, no session invalidation.
 */
const authTrace = require('./authTrace');
const { analyze } = require('../scripts/authConsistencyCheck');

const SNAPSHOT_CAP = 168;   // 7 days of hourly snapshots
const ANOMALY_CAP  = 500;
const CACHE_MAX    = 5000;  // in-process identity cache (LRU-approximate)
const SNAPSHOT_INTERVAL_MS = 3600_000; // 1 hour

const identityCache = new Map(); // userId → { orgId, source, ts }
let _snapshotTimer = null;
let _redis = null;  // set by init()

// ---- helpers ----

function isEnabled() { const m = process.env.BURN_IN_MODE; return m === 'true' || m === 'complete'; }
function isComplete() { return process.env.BURN_IN_MODE === 'complete'; }

function computeScore(hs256Share, mismatchRate, driftRate, tenantMismatchRate) {
  return Math.round(Math.min(100, 100 * (
    0.50 * (hs256Share || 0) +
    0.25 * (mismatchRate || 0) +
    0.15 * (driftRate || 0) +
    0.10 * (tenantMismatchRate || 0)
  )));
}

function evictCache() {
  if (identityCache.size <= CACHE_MAX) return;
  // evict oldest 10% by insertion order (Map iteration = insertion order)
  const evictCount = Math.ceil(CACHE_MAX * 0.10);
  let i = 0;
  for (const k of identityCache.keys()) {
    identityCache.delete(k);
    if (++i >= evictCount) break;
  }
}

// ---- anomaly logger ----

function logAnomaly(anomaly) {
  try {
    process.stdout.write('BURNINANOMALY ' + JSON.stringify(anomaly) + '\n');
    const r = _redis;
    if (r) {
      const p = r.pipeline();
      p.lpush('auth:burnin:anomalies', JSON.stringify(anomaly));
      p.ltrim('auth:burnin:anomalies', 0, ANOMALY_CAP - 1);
      p.incr('auth:burnin:anomaly_count');
      p.exec(() => {});
    }
  } catch (e) {
    // anomaly logging must never throw — log and swallow.
    console.debug('[burn-in] logAnomaly failed (non-fatal):', e && e.message);
  }
}

// ---- snapshot ----

// externalRedis: optional — scripts pass their own client; runtime uses the module-level _redis.
async function takeSnapshot(externalRedis) {
  const r = externalRedis || _redis;
  if (!r) return null;
  try {
    const counters = await authTrace.getAllCounters('production');
    const events   = await authTrace.getRecentRedis(2000, 'production');
    const consistency = analyze(events);

    let totalAccept = 0, rs256Accept = 0, islandTotal = 0, islandHs = 0;
    for (const svc in counters) {
      const c = counters[svc];
      totalAccept += c.accept || 0;
      rs256Accept += (c.src_gateway || 0) + (c.src_auth_service || 0);
      if (svc !== 'auth-gateway') {
        islandTotal += c.total || 0;
        islandHs    += c.src_island_hs256 || 0;
      }
    }

    const hs256Share    = islandTotal  ? +(islandHs / islandTotal).toFixed(4)   : 0;
    const rs256Adoption = totalAccept  ? +(rs256Accept / totalAccept).toFixed(4) : 0;
    const orphanRate    = consistency.usersObserved
      ? +(consistency.orphanSessions.length / consistency.usersObserved).toFixed(4) : 0;
    const score = computeScore(hs256Share, consistency.mismatchRate, consistency.driftRate, consistency.tenantMismatchRate);

    const snapshot = {
      ts: new Date().toISOString(),
      hs256Share,
      mismatchRate: consistency.mismatchRate,
      tenantDrift: consistency.tenantMismatchRate,
      driftRate: consistency.driftRate,
      rs256Adoption,
      orphanRate,
      score,
    };

    const p = r.pipeline();
    p.lpush('auth:burnin:snapshots', JSON.stringify(snapshot));
    p.ltrim('auth:burnin:snapshots', 0, SNAPSHOT_CAP - 1);
    p.setnx('auth:burnin:started_at', snapshot.ts); // no-op if already set by init()
    await p.exec();
    return snapshot;
  } catch { return null; }
}

// ---- init (call once at gateway startup) ----

function init(redisClient) {
  if (!isEnabled()) return;
  _redis = redisClient;
  redisClient.setnx('auth:burnin:started_at', new Date().toISOString()).catch(() => {});
  if (isComplete()) {
    // Burn-in window declared complete: anomaly detection stays active, snapshot interval stops.
    console.log('[burn-in] mode=COMPLETE  snapshot interval stopped  anomaly detection active');
    return;
  }
  // Hourly snapshot interval — unref so it doesn't block graceful shutdown.
  _snapshotTimer = setInterval(() => { takeSnapshot().catch(() => {}); }, SNAPSHOT_INTERVAL_MS);
  if (_snapshotTimer.unref) _snapshotTimer.unref();
  console.log('[burn-in] mode=ON  snapshots every 1h  anomaly-cache=' + CACHE_MAX);
}

// ---- Express middleware (mount after authTrace) ----

function middleware() {
  if (!isEnabled()) return (_req, _res, next) => next(); // no-op when burn-in is off
  return function burnInObserver(req, res, next) {
    res.on('finish', () => {
      try {
        const id = req.auth || req.user;
        if (!id || id.userId == null) return;
        const userId = String(id.userId);
        const orgId  = String(id.orgId ?? id.tenantId ?? '');
        const cached = identityCache.get(userId);
        if (cached && cached.orgId !== orgId && cached.orgId !== '' && orgId !== '') {
          logAnomaly({
            type: 'identity_drift',
            userId,
            previous: { orgId: cached.orgId, source: cached.source },
            current:  { orgId, source: id.source || 'unknown' },
            path: String(req.originalUrl || req.url || '').split('?')[0],
            ts: new Date().toISOString(),
          });
        }
        identityCache.set(userId, { orgId, source: id.source || 'unknown', ts: Date.now() });
        evictCache();
      } catch (e) {
        // anomaly detection must never throw — log and swallow.
        console.debug('[burn-in] anomaly detection failed (non-fatal):', e && e.message);
      }
    });
    next();
  };
}

// ---- status query (for /auth-capability-check + health) ----

async function getStatus() {
  if (!_redis) return { burn_in_mode: isEnabled(), started_at: null, duration_hours: null };
  try {
    const startedAt = await _redis.get('auth:burnin:started_at');
    const anomalyCount = Number(await _redis.get('auth:burnin:anomaly_count') || 0);
    const snapshotRaw = await _redis.lrange('auth:burnin:snapshots', 0, 0); // newest snapshot
    const latestSnapshot = snapshotRaw[0] ? JSON.parse(snapshotRaw[0]) : null;
    const durationHours = startedAt
      ? +((Date.now() - new Date(startedAt).getTime()) / 3_600_000).toFixed(2) : null;
    return { burn_in_mode: true, started_at: startedAt, duration_hours: durationHours, anomaly_count: anomalyCount, latest_snapshot: latestSnapshot };
  } catch { return { burn_in_mode: isEnabled() }; }
}

// ---- exported API ----

module.exports = { init, middleware, takeSnapshot, getStatus, computeScore, isEnabled, isComplete };
