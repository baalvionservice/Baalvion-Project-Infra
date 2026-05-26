'use strict';

/**
 * Telemetry → ClickHouse streaming pipeline. Consumes the gateway's `usage:events`
 * Redis Stream via its OWN consumer group (`intelligence`) — independent of the
 * metering group, so both see every event — enriches each event (target class,
 * ban/captcha flags) and batch-inserts into ClickHouse `routing_telemetry`,
 * which is the source for the ban/anomaly/geo training datasets + feature MVs.
 *
 * When ClickHouse is disabled (no CLICKHOUSE_URL) the pipeline idles and the
 * intelligence layer falls back to TimescaleDB aggregates — no data loss, just a
 * coarser feature granularity. Replay is supported (re-create the group at id 0).
 */

const os = require('os');
const { getRedis } = require('../service/redisClient');
const ch = require('../service/chClient');
const { targetClass } = require('../service/featureEngineering');
const logger = require('../service/logger');

const STREAM = process.env.USAGE_STREAM || 'usage:events';
const GROUP = process.env.INTEL_GROUP || 'intelligence';
const CONSUMER = `${GROUP}-${os.hostname()}-${process.pid}`;
const BATCH = Number(process.env.INTEL_BATCH || 512);

let running = false;

function fieldsToObj(arr) {
  const o = {};
  for (let i = 0; i + 1 < arr.length; i += 2) o[arr[i]] = arr[i + 1];
  return o;
}

function toTelemetry(f) {
  const org = f.org || f.orgId || '';
  if (!org) return null;
  const status = Number(f.status || 0);
  const success = f.success === 'true' || f.success === true || (status > 0 && status < 400);
  const host = f.dest || f.destHost || '';
  return {
    ts: Math.floor((Number(f.ts) || Date.now()) / 1000), // CH DateTime64 accepts unix seconds
    org_id: org,
    provider: f.provider || 'unknown',
    exit_ip: f.exitIp || f.exit_ip || '',
    asn: Number(f.asn || 0),
    country: (f.country || '').toLowerCase(),
    target: host,
    target_class: targetClass(host),
    proxy_type: f.proxyType || f.kind || 'unknown',
    session_id: f.session || f.sessionId || '',
    bytes_in: Number(f.bytesIn || 0),
    bytes_out: Number(f.bytesOut || 0),
    connect_ms: Number(f.connectMs || 0),
    ttfb_ms: Number(f.ttfbMs || 0),
    latency_ms: Number(f.latencyMs || 0),
    status,
    success: success ? 1 : 0,
    banned: status === 403 || status === 429 ? 1 : 0,
    captcha: f.captcha === 'true' || f.captcha === '1' || status === 429 ? 1 : 0,
    tunnel_stable: f.reset === 'true' ? 0 : 1,
  };
}

async function ensureGroup(redis) {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '$', 'MKSTREAM');
  } catch (err) {
    if (!String(err.message).includes('BUSYGROUP')) throw err;
  }
}

async function start() {
  if (!ch.isEnabled()) {
    logger.info('[telemetry-pipeline] ClickHouse disabled (no CLICKHOUSE_URL) — pipeline idle, models use TimescaleDB');
    return;
  }
  const redis = getRedis();
  if (!redis) { logger.warn('[telemetry-pipeline] no redis — pipeline disabled'); return; }
  await ensureGroup(redis);
  running = true;
  logger.info(`[telemetry-pipeline] consuming ${STREAM} as ${CONSUMER} → ClickHouse`);
  loop(redis).catch((err) => logger.error('[telemetry-pipeline] loop crashed:', err.message));
}

async function loop(redis) {
  while (running) {
    let res;
    try {
      res = await redis.xreadgroup('GROUP', GROUP, CONSUMER, 'COUNT', BATCH, 'BLOCK', 5000, 'STREAMS', STREAM, '>');
    } catch (err) {
      logger.error('[telemetry-pipeline] xreadgroup:', err.message);
      await sleep(1000);
      continue;
    }
    if (!res) continue;
    const entries = res[0][1];
    const rows = [];
    const ids = [];
    for (const [id, fields] of entries) {
      ids.push(id);
      const row = toTelemetry(fieldsToObj(fields));
      if (row) rows.push(row);
    }
    if (rows.length) {
      try { await ch.insertTelemetry(rows); }
      catch (err) { logger.error('[telemetry-pipeline] CH insert failed (will retry on redelivery):', err.message); continue; }
    }
    if (ids.length) {
      try { await redis.xack(STREAM, GROUP, ...ids); } catch (_) {}
    }
  }
}

function stop() { running = false; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

module.exports = { start, stop, toTelemetry };
