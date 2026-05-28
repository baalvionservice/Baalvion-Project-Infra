'use strict';

/**
 * Metering ingestion worker — consumes the gateway's `usage:events` Redis Stream
 * via a consumer group, deduplicates, batch-inserts into TimescaleDB, maintains
 * live per-org counters, evaluates quotas in real time, and dead-letters
 * poison events. Run via `node workers/index.js` (multiple replicas safe — the
 * consumer group load-balances and XAUTOCLAIM recovers crashed consumers).
 */

const os = require('os');
const { getRedis } = require('../service/redisClient');
const ts = require('../service/timeseriesDb');
const quotaService = require('../service/quotaService');
const abuse = require('../service/abuseDetection');
const metrics = require('../observability/meteringMetrics');
const logger = require('../service/logger');

const STREAM = process.env.USAGE_STREAM || 'usage:events';
const DLQ = STREAM + ':dlq';
const GROUP = process.env.USAGE_GROUP || 'metering';
const CONSUMER = `${GROUP}-${os.hostname()}-${process.pid}`;
const BATCH = Number(process.env.METERING_BATCH || 256);
const MAX_DELIVERIES = Number(process.env.METERING_MAX_DELIVERIES || 6);

let running = false;
const attemptCounts = new Map(); // streamId -> processing attempts (for DLQ decision)

function fieldsToObj(arr) {
  const o = {};
  for (let i = 0; i + 1 < arr.length; i += 2) o[arr[i]] = arr[i + 1];
  return o;
}

function toEvent(id, f) {
  const org = f.org || f.orgId || '';
  if (!org) return null; // only org-scoped events are billable/analyzable
  const tsMs = Number(f.ts) || Date.now();
  return {
    eventId: id,
    ts: new Date(tsMs),
    orgId: org,
    apiKeyId: f.apiKey || f.apiKeyId || null,
    sessionId: f.session || f.sessionId || null,
    provider: f.provider || 'unknown',
    country: (f.country || '').toLowerCase(),
    destHost: f.dest || f.destHost || null,
    bytesIn: Number(f.bytesIn || 0),
    bytesOut: Number(f.bytesOut || 0),
    latencyMs: Number(f.latencyMs || 0),
    status: Number(f.status || 0),
    success: f.success === 'true' || f.success === true || Number(f.status) < 400,
  };
}

async function insertBatch(events) {
  if (events.length === 0) return;
  const cols = ['event_id', 'ts', 'org_id', 'api_key_id', 'session_id', 'provider', 'country', 'dest_host', 'bytes_in', 'bytes_out', 'requests', 'latency_ms', 'status', 'success'];
  const values = [];
  const rows = events.map((e, i) => {
    const b = i * cols.length;
    values.push(
      e.eventId, e.ts, e.orgId, e.apiKeyId, e.sessionId, e.provider, e.country,
      e.destHost, e.bytesIn, e.bytesOut, 1, e.latencyMs, e.status, e.success,
    );
    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12},$${b + 13},$${b + 14})`;
  });
  const sql =
    `INSERT INTO usage_events (${cols.join(',')}) VALUES ${rows.join(',')} ` +
    `ON CONFLICT (event_id, ts) DO NOTHING`;
  await ts.query(sql, values);
}

// Update live per-org monthly counters in Redis and evaluate quota.
async function updateCountersAndQuota(redis, events) {
  const byOrg = new Map();
  for (const e of events) {
    const cur = byOrg.get(e.orgId) || { bytes: 0, countries: new Set() };
    cur.bytes += e.bytesIn + e.bytesOut;
    if (e.country) cur.countries.add(e.country);
    byOrg.set(e.orgId, cur);
  }
  const period = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM

  for (const [org, agg] of byOrg) {
    try {
      const key = `usage:live:${org}:${period}`;
      const total = await redis.incrby(key, agg.bytes);
      await redis.expire(key, 45 * 86400);
      await quotaService.evaluate(org, Number(total));
      abuse.observe(org, agg.bytes, Array.from(agg.countries)).catch(() => {});
    } catch (err) {
      logger.error('[metering] counter/quota update failed:', err.message);
    }
  }
}

async function processEntries(redis, entries) {
  const events = [];
  const ids = [];
  for (const [id, fieldArr] of entries) {
    ids.push(id);
    const ev = toEvent(id, fieldsToObj(fieldArr));
    if (ev) events.push(ev);
  }
  if (events.length === 0) {
    if (ids.length) await redis.xack(STREAM, GROUP, ...ids);
    return;
  }

  try {
    await insertBatch(events);
    await updateCountersAndQuota(redis, events);
    await redis.xack(STREAM, GROUP, ...ids);
    for (const id of ids) attemptCounts.delete(id);
    metrics.incIngest(events.length);
  } catch (err) {
    metrics.incIngestError();
    logger.error('[metering] batch failed, will retry:', err.message);
    // Leave entries un-acked → redelivered via XAUTOCLAIM; DLQ after MAX_DELIVERIES.
    for (const id of ids) attemptCounts.set(id, (attemptCounts.get(id) || 0) + 1);
    await maybeDeadLetter(redis, entries, ids);
  }
}

async function maybeDeadLetter(redis, entries, ids) {
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if ((attemptCounts.get(id) || 0) >= MAX_DELIVERIES) {
      try {
        const flat = entries[i][1];
        await redis.xadd(DLQ, '*', ...flat, 'origId', id, 'failedAt', String(Date.now()));
        await redis.xack(STREAM, GROUP, id);
        attemptCounts.delete(id);
        metrics.incDLQ();
        logger.warn('[metering] dead-lettered event', id);
      } catch (err) {
        logger.error('[metering] DLQ write failed:', err.message);
      }
    }
  }
}

// Recover entries from consumers that crashed mid-process.
async function claimStale(redis) {
  try {
    const res = await redis.xautoclaim(STREAM, GROUP, CONSUMER, 60000, '0', 'COUNT', BATCH);
    const entries = Array.isArray(res) ? res[1] : [];
    if (entries && entries.length) {
      await processEntries(redis, entries);
    }
  } catch (err) {
    if (!String(err.message).includes('NOGROUP')) {
      logger.error('[metering] xautoclaim error:', err.message);
    }
  }
}

async function ensureGroup(redis) {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '$', 'MKSTREAM');
  } catch (err) {
    if (!String(err.message).includes('BUSYGROUP')) throw err;
  }
}

async function start() {
  const redis = getRedis();
  if (!redis) {
    logger.error('[metering] REDIS_URL not configured — metering worker cannot start');
    return;
  }
  await ensureGroup(redis);
  running = true;
  logger.info(`[metering] consuming ${STREAM} as ${CONSUMER}`);

  let claimTick = 0;
  while (running) {
    try {
      const res = await redis.xreadgroup('GROUP', GROUP, CONSUMER, 'COUNT', BATCH, 'BLOCK', 5000, 'STREAMS', STREAM, '>');
      if (res && res.length) {
        const entries = res[0][1];
        await processEntries(redis, entries);
      }
      if (++claimTick % 6 === 0) await claimStale(redis); // ~every 30s of idle blocks
    } catch (err) {
      logger.error('[metering] read loop error:', err.message);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

function stop() { running = false; }

module.exports = { start, stop };
