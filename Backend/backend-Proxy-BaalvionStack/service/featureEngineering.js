'use strict';

/**
 * Feature engineering layer. Turns raw telemetry (TimescaleDB usage_events +
 * continuous aggregates, ClickHouse rollups when enabled, live Redis provider
 * state) into the feature store rows the models train + infer on:
 *   provider_features, asn_quality_scores, geo_latency_models.
 *
 * Pure transforms are exported for unit testing; the async fns do the I/O.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const ch = require('./chClient');
const pricing = require('./pricing');
const { getRedis } = require('./redisClient');
const mlMath = require('./mlMath');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;

// ── pure feature transforms ────────────────────────────────────────────────────

/** Provider efficiency = success per unit cost, latency-penalised. Higher = better. */
function providerEfficiency({ successRate = 0, costPerGb = 0.5, p95Latency = 0 }) {
  const cost = costPerGb > 0 ? costPerGb : 0.5;
  const latPenalty = 1 / (1 + Math.max(0, p95Latency) / 2000); // 2s p95 → 0.5
  return (successRate / cost) * latPenalty;
}

/** ASN quality 0..100 from success + ban + latency (ML feature, not operator rep). */
function asnQuality({ successRate = 1, banRate = 0, latencyP50 = 0 }) {
  const succ = mlMath.clamp(successRate, 0, 1);
  const ban = mlMath.clamp(banRate, 0, 1);
  const latScore = 1 / (1 + Math.max(0, latencyP50) / 1000); // 1s p50 → 0.5
  const q = (0.55 * succ + 0.30 * (1 - ban) + 0.15 * latScore) * 100;
  return Math.round(mlMath.clamp(q, 0, 100));
}

/** Classify a destination host into a coarse target class (ban models key on this). */
function targetClass(host) {
  const h = String(host || '').toLowerCase();
  if (/amazon|ebay|walmart|shopify|aliexpress|etsy|target\./.test(h)) return 'ecommerce';
  if (/instagram|facebook|tiktok|twitter|x\.com|linkedin|reddit|pinterest/.test(h)) return 'social';
  if (/google|bing|duckduckgo|yandex|baidu/.test(h)) return 'search';
  if (/booking|expedia|airbnb|kayak|tripadvisor/.test(h)) return 'travel';
  if (/ticketmaster|stubhub|nike|adidas|supreme/.test(h)) return 'sneaker_ticket';
  return 'generic';
}

// ── I/O: compute + persist features ─────────────────────────────────────────────

/** Provider feature row from Timescale (+ CH latency quantiles when available). */
async function computeProviderFeatures(windowHours = 24) {
  const since = new Date(Date.now() - windowHours * 3600000);
  const rows = await ts.query(
    `SELECT provider,
            SUM(requests)::bigint AS requests,
            SUM(CASE WHEN success THEN 0 ELSE 1 END)::bigint AS failures,
            SUM(bytes_in + bytes_out)::bigint AS bytes,
            AVG(latency_ms) AS avg_lat,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50,
            percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95
     FROM usage_events WHERE ts >= $1 GROUP BY provider`,
    [since],
  );
  const costByProvider = await providerCosts();
  const bucket = new Date();
  const out = [];
  for (const r of rows.rows) {
    const requests = Number(r.requests) || 0;
    const failures = Number(r.failures) || 0;
    const successRate = requests > 0 ? (requests - failures) / requests : 1;
    const banRate = await providerBanRate(r.provider, since);
    const costPerGb = costByProvider[r.provider] ?? 0.5;
    const p95 = Number(r.p95) || 0;
    const feat = {
      provider: r.provider,
      successRate,
      banRate,
      p50Latency: Number(r.p50) || 0,
      p95Latency: p95,
      throughputGb: Number(r.bytes) / GB,
      costPerGb,
      efficiency: providerEfficiency({ successRate, costPerGb, p95Latency: p95 }),
      sampleCount: requests,
    };
    await db.sequelize.query(
      `INSERT INTO provider_features (provider, bucket, success_rate, ban_rate, p50_latency, p95_latency, throughput_gb, cost_per_gb, efficiency, sample_count)
       VALUES (:provider, date_trunc('hour', :bucket), :sr, :br, :p50, :p95, :tp, :cost, :eff, :n)
       ON CONFLICT (provider, bucket) DO UPDATE SET success_rate=EXCLUDED.success_rate, ban_rate=EXCLUDED.ban_rate,
         p50_latency=EXCLUDED.p50_latency, p95_latency=EXCLUDED.p95_latency, throughput_gb=EXCLUDED.throughput_gb,
         cost_per_gb=EXCLUDED.cost_per_gb, efficiency=EXCLUDED.efficiency, sample_count=EXCLUDED.sample_count, computed_at=now()`,
      { replacements: { provider: r.provider, bucket, sr: successRate, br: banRate, p50: feat.p50Latency,
          p95, tp: feat.throughputGb, cost: costPerGb, eff: feat.efficiency, n: requests }, type: Q.INSERT },
    );
    out.push(feat);
  }
  return out;
}

async function providerCosts() {
  try {
    const rows = await db.sequelize.query(`SELECT name, cost_per_gb FROM providers`, { type: Q.SELECT });
    const map = {};
    for (const r of rows) map[r.name] = Number(r.cost_per_gb) || 0.5;
    return map;
  } catch (_) { return {}; }
}

async function providerBanRate(provider, since) {
  // Prefer ClickHouse (has explicit ban flag); else approximate via 4xx/5xx in Timescale.
  if (ch.isEnabled()) {
    try {
      const r = await ch.query(
        `SELECT sum(bans) AS bans, sum(requests) AS reqs FROM baalvion.ban_features_hourly
         WHERE provider = '${provider.replace(/'/g, '')}' AND hour >= toDateTime(${Math.floor(since.getTime() / 1000)})`,
      );
      const row = r[0] || {};
      const reqs = Number(row.reqs) || 0;
      return reqs > 0 ? Number(row.bans) / reqs : 0;
    } catch (_) { /* fall through */ }
  }
  const res = await ts.query(
    `SELECT COUNT(*) FILTER (WHERE status IN (403,429,503)) AS bans, COUNT(*) AS reqs
     FROM usage_events WHERE provider = $1 AND ts >= $2`,
    [provider, since],
  );
  const row = res.rows[0] || {};
  const reqs = Number(row.reqs) || 0;
  return reqs > 0 ? Number(row.bans) / reqs : 0;
}

/** ASN quality scores from the asn_intelligence operator data + telemetry. */
async function computeAsnQuality() {
  const rows = await db.sequelize.query(
    `SELECT asn, ban_rate, success_rate FROM asn_intelligence`, { type: Q.SELECT },
  ).catch(() => []);
  const out = [];
  for (const r of rows) {
    const successRate = r.success_rate != null ? Number(r.success_rate) / 100 : 1;
    const banRate = Number(r.ban_rate) || 0;
    const quality = asnQuality({ successRate, banRate, latencyP50: 0 });
    await db.sequelize.query(
      `INSERT INTO asn_quality_scores (asn, quality_score, success_rate, ban_rate, latency_p50, sample_count, updated_at)
       VALUES (:asn, :q, :sr, :br, 0, 0, now())
       ON CONFLICT (asn) DO UPDATE SET quality_score=EXCLUDED.quality_score, success_rate=EXCLUDED.success_rate,
         ban_rate=EXCLUDED.ban_rate, updated_at=now()`,
      { replacements: { asn: r.asn, q: quality, sr: successRate, br: banRate }, type: Q.INSERT },
    );
    out.push({ asn: r.asn, quality });
  }
  return out;
}

/** Geo latency models (per-country p50/p95/p99 + jitter). */
async function computeGeoLatency(windowHours = 24) {
  const since = new Date(Date.now() - windowHours * 3600000);
  const res = await ts.query(
    `SELECT country,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50,
            percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
            percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99,
            stddev_pop(latency_ms) AS jitter, COUNT(*) AS n
     FROM usage_events WHERE ts >= $1 AND country <> '' GROUP BY country`,
    [since],
  );
  const out = [];
  for (const r of res.rows) {
    await db.sequelize.query(
      `INSERT INTO geo_latency_models (country, p50, p95, p99, jitter, sample_count, updated_at)
       VALUES (:c, :p50, :p95, :p99, :j, :n, now())
       ON CONFLICT (country) DO UPDATE SET p50=EXCLUDED.p50, p95=EXCLUDED.p95, p99=EXCLUDED.p99,
         jitter=EXCLUDED.jitter, sample_count=EXCLUDED.sample_count, updated_at=now()`,
      { replacements: { c: r.country, p50: Number(r.p50) || 0, p95: Number(r.p95) || 0,
          p99: Number(r.p99) || 0, j: Number(r.jitter) || 0, n: Number(r.n) || 0 }, type: Q.INSERT },
    );
    out.push({ country: r.country, p50: Number(r.p50) || 0, p95: Number(r.p95) || 0 });
  }
  return out;
}

/** Run the whole feature refresh (called by the worker). */
async function refreshAll() {
  const [providers, asns, geo] = await Promise.all([
    computeProviderFeatures().catch((e) => { logger.error('[features] provider:', e.message); return []; }),
    computeAsnQuality().catch((e) => { logger.error('[features] asn:', e.message); return []; }),
    computeGeoLatency().catch((e) => { logger.error('[features] geo:', e.message); return []; }),
  ]);
  return { providers: providers.length, asns: asns.length, geo: geo.length };
}

module.exports = {
  providerEfficiency, asnQuality, targetClass,
  computeProviderFeatures, computeAsnQuality, computeGeoLatency, refreshAll,
};
