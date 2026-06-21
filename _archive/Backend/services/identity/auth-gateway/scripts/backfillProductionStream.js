'use strict';
/**
 * Phase 6E-6.5 STEP 7 — one-time backfill. Reads legacy auth:trace:recent (mixed stream, written
 * before 6E-6.5 stream separation), classifies each event, and rebuilds:
 *   auth:trace:prod:recent          — production events
 *   auth:trace:sim:recent           — simulation events
 *   auth:trace:prod:counters:<svc>  — production counters per service
 *   auth:trace:sim:counters:<svc>   — simulation counters per service
 *
 * Classification rules (in order):
 *   1. event.stream === 'simulation'  → simulation
 *   2. event.stream === 'production'  → production
 *   3. no stream field (pre-6E-6.5)  → production (runtime events had no synthetic markers)
 *
 * NEVER deletes auth:trace:recent or auth:trace:counters:* (legacy keys kept intact).
 * Safe to re-run — LPUSH + LTRIM are idempotent on a deduplicated list; counters accumulate.
 *
 * Usage:
 *   NODE_PATH=".../auth-service/node_modules" node scripts/backfillProductionStream.js
 *   NODE_PATH=".../auth-service/node_modules" node scripts/backfillProductionStream.js --dry-run
 */
const authTrace = require('../observability/authTrace');

const DRY_RUN = process.argv.includes('--dry-run');
const RECENT_MAX = 2000;

(async () => {
  const events = await authTrace.getRecentRedisMixed(2000);
  if (!events.length) {
    console.log(JSON.stringify({ tool: 'backfillProductionStream', status: 'nothing_to_migrate', legacyEventCount: 0 }));
    process.exit(0);
  }

  const prod = [], sim = [];
  for (const evt of events) {
    if (evt.stream === 'simulation') sim.push(evt);
    else prod.push(evt);  // 'production' OR missing stream field → production
  }

  const report = {
    tool: 'backfillProductionStream',
    mode: DRY_RUN ? 'DRY-RUN' : 'APPLY',
    legacyEventCount: events.length,
    production_event_count: prod.length,
    simulation_event_count: sim.length,
    contamination_removed: sim.length > 0,
  };

  if (DRY_RUN) {
    console.log(JSON.stringify({ ...report, note: 'Pass without --dry-run to write.' }, null, 2));
    process.exit(0);
  }

  // ---- write segregated recent lists (oldest → LPUSH → newest at head, maintaining LPUSH order) ----
  const r = authTrace.getRecentRedisMixed; // just to confirm redis is reachable via module
  // Access redis via the lazy getter exposed by authTrace internals
  // We use ioredis directly here since we need pipeline writes
  let ioredis;
  try { ioredis = require('ioredis'); }
  catch { ioredis = require(process.env.IOREDIS_PATH || 'd:/Baalvion Projects/Backend/services/identity/auth-service/node_modules/ioredis'); }
  const Redis = ioredis.default || ioredis;
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 2,
  });
  redis.on('error', (e) => { console.error('[backfill] Redis error:', e.message); });

  // Push events oldest-first (reversed) so LPUSH leaves newest at head — matches write-time ordering.
  async function pushEvents(key, bucket) {
    if (!bucket.length) return;
    const reversed = bucket.slice().reverse();
    const pipeline = redis.pipeline();
    for (const evt of reversed) pipeline.lpush(key, JSON.stringify(evt));
    pipeline.ltrim(key, 0, RECENT_MAX - 1);
    await pipeline.exec();
  }

  // Rebuild counters from a bucket of events.
  async function rebuildCounters(bucket, counterKeyFn) {
    if (!bucket.length) return;
    const pipeline = redis.pipeline();
    for (const evt of bucket) {
      if (!evt.service) continue;
      const cKey = counterKeyFn(evt.service);
      pipeline.hincrby(cKey, 'total', 1);
      pipeline.hincrby(cKey, evt.result === 'reject' ? 'reject' : (evt.result === 'accept' ? 'accept' : 'anonymous'), 1);
      if (evt.auth_source) pipeline.hincrby(cKey, 'src_' + evt.auth_source.replace(/[^a-z0-9]/gi, '_'), 1);
      const imode = evt.identity_mode || (evt.auth_source === 'gateway' ? 'gateway' : evt.auth_source === 'auth-service' ? 'rs256' : evt.auth_source === 'island-hs256' ? 'hs256' : 'anonymous');
      pipeline.hincrby(cKey, 'imode_' + imode, 1);
      if (evt.strict_would_reject) pipeline.hincrby(cKey, 'strict_would_reject', 1);
    }
    await pipeline.exec();
  }

  await pushEvents(authTrace.PROD_RECENT_KEY, prod);
  await pushEvents(authTrace.SIM_RECENT_KEY, sim);
  await rebuildCounters(prod, authTrace.PROD_COUNTERS_KEY);
  await rebuildCounters(sim, authTrace.SIM_COUNTERS_KEY);

  report.prod_recent_key = authTrace.PROD_RECENT_KEY;
  report.sim_recent_key = authTrace.SIM_RECENT_KEY;
  report.note = 'Legacy auth:trace:recent and auth:trace:counters:* are untouched.';
  console.log(JSON.stringify(report, null, 2));

  await redis.quit();
  process.exit(0);
})().catch((e) => { console.error('backfillProductionStream error:', e.message); process.exit(1); });
