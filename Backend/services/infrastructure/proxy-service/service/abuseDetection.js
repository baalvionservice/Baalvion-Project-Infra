'use strict';

/**
 * Lightweight, Redis-backed traffic anomaly detection fed by the metering
 * stream. Real heuristics (no ML, no fake scores):
 *   - bandwidth spike vs an EWMA baseline
 *   - geo fan-out (one org touching an implausible number of countries/min)
 * Findings raise alerts and write abuse_logs; they do not auto-block here
 * (blocking is a quota/admin decision).
 */

const { getRedis } = require('./redisClient');
const logger = require('./logger');

const SPIKE_FACTOR = Number(process.env.ABUSE_SPIKE_FACTOR || 10);
const SPIKE_FLOOR_BYTES = Number(process.env.ABUSE_SPIKE_FLOOR_BYTES || 500 * 1024 * 1024); // 500MB/min
const GEO_FANOUT_MAX = Number(process.env.ABUSE_GEO_FANOUT_MAX || 40);

const ewmaKey = (org) => `usage:ewma:${org}`;
const geoKey = (org, minute) => `abuse:geo:${org}:${minute}`;
const flagKey = (org, kind) => `abuse:flag:${org}:${kind}`;

async function observe(orgId, deltaBytes, countries) {
  const redis = getRedis();
  if (!redis || !orgId) return;
  try {
    await detectSpike(redis, orgId, deltaBytes);
    await detectGeoFanout(redis, orgId, countries);
  } catch (err) {
    logger.error('[abuse] observe error:', err.message);
  }
}

async function detectSpike(redis, orgId, deltaBytes) {
  const prev = Number(await redis.get(ewmaKey(orgId))) || 0;
  const ewma = prev === 0 ? deltaBytes : Math.round(0.7 * prev + 0.3 * deltaBytes);
  await redis.set(ewmaKey(orgId), String(ewma), 'EX', 3600);

  if (prev > 0 && deltaBytes > SPIKE_FLOOR_BYTES && deltaBytes > prev * SPIKE_FACTOR) {
    await raise(redis, orgId, 'bandwidth_spike',
      `Traffic spiked to ${(deltaBytes / 1e6).toFixed(1)}MB vs baseline ${(prev / 1e6).toFixed(1)}MB`);
  }
}

async function detectGeoFanout(redis, orgId, countries) {
  if (!countries || countries.length === 0) return;
  const minute = Math.floor(Date.now() / 60000);
  const k = geoKey(orgId, minute);
  await redis.sadd(k, ...countries.filter(Boolean));
  await redis.expire(k, 120);
  const distinct = await redis.scard(k);
  if (distinct > GEO_FANOUT_MAX) {
    await raise(redis, orgId, 'geo_fanout', `${distinct} distinct countries in one minute`);
  }
}

// Raise an alert + persist abuse_log, de-duped to once per 10 min per kind.
async function raise(redis, orgId, kind, detail) {
  const set = await redis.set(flagKey(orgId, kind), '1', 'EX', 600, 'NX');
  if (set !== 'OK') return;

  try {
    const db = require('../models');
    await db.abuse_logs.create({
      org_id: orgId, event_type: kind, severity: 'high', reason: detail, resolved: false,
    });
  } catch (err) {
    logger.error('[abuse] log write failed:', err.message);
  }
  try { require('./alertService').abuseAlert(orgId, kind, detail); } catch (_) {}
}

module.exports = { observe };
