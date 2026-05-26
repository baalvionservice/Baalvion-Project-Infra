'use strict';

/**
 * Edge region/PoP registry + health + locality routing. pickRegion() is PURE
 * (unit-tested) — nearest healthy region by continent affinity then weight.
 * Health snapshots are published to Redis (`region:health:{code}`) for routing
 * weight decisions; GeoDNS/Anycast does the actual client steering.
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const edgeMetrics = require('../observability/edgeMetrics');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

// Country → continent (subset; extend as needed). Used for nearest-region affinity.
const CONTINENT = {
  us: 'NA', ca: 'NA', mx: 'NA',
  br: 'SA', ar: 'SA', cl: 'SA',
  gb: 'EU', de: 'EU', fr: 'EU', nl: 'EU', es: 'EU', it: 'EU',
  in: 'IN',
  sg: 'SEA', id: 'SEA', th: 'SEA', vn: 'SEA', my: 'SEA',
  ae: 'ME', sa: 'ME', tr: 'ME',
  za: 'AF', ng: 'AF', eg: 'AF',
  au: 'OC', nz: 'OC',
};

/** Pick the best region for a target country from a region list. */
function pickRegion(country, regions) {
  const healthy = regions.filter((r) => r.enabled !== false && r.status !== 'offline');
  if (healthy.length === 0) return null;
  const continent = CONTINENT[String(country || '').toLowerCase()];
  const local = healthy.filter((r) => r.continent === continent);
  const pool = local.length ? local : healthy;
  // Prefer healthy over degraded, then highest weight.
  pool.sort((a, b) => {
    const sa = a.status === 'healthy' ? 1 : 0;
    const sb = b.status === 'healthy' ? 1 : 0;
    if (sa !== sb) return sb - sa;
    return (b.weight || 0) - (a.weight || 0);
  });
  return pool[0];
}

async function listRegions() {
  return db.sequelize.query(`SELECT * FROM edge_regions ORDER BY continent, code`, { type: Q.SELECT });
}

async function upsertRegion(r) {
  await db.sequelize.query(
    `INSERT INTO edge_regions (code, name, continent, gateway_endpoint, lat, lon, weight, status, enabled)
     VALUES (:code,:name,:cont,:gw,:lat,:lon,:weight,:status,:enabled)
     ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, continent=EXCLUDED.continent, gateway_endpoint=EXCLUDED.gateway_endpoint,
       lat=EXCLUDED.lat, lon=EXCLUDED.lon, weight=EXCLUDED.weight, status=EXCLUDED.status, enabled=EXCLUDED.enabled`,
    { replacements: { code: r.code, name: r.name, cont: r.continent || null, gw: r.gatewayEndpoint || null,
        lat: r.lat || null, lon: r.lon || null, weight: r.weight || 100, status: r.status || 'healthy', enabled: r.enabled !== false }, type: Q.INSERT },
  );
  return { code: r.code };
}

async function recordHealth(code, m) {
  await db.sequelize.query(
    `INSERT INTO regional_health (region_code, latency_ms, saturation, active_tunnels, success_rate, status)
     VALUES (:code, :lat, :sat, :tun, :sr, :status)`,
    { replacements: { code, lat: m.latencyMs || null, sat: m.saturation || null, tun: m.activeTunnels || null, sr: m.successRate || null, status: m.status || 'healthy' }, type: Q.INSERT },
  );
  // Auto-mark region degraded/offline on poor health.
  const status = m.status || (m.successRate != null && m.successRate < 50 ? 'offline' : m.saturation > 0.9 ? 'degraded' : 'healthy');
  await db.sequelize.query(`UPDATE edge_regions SET status = :s WHERE code = :code`, { replacements: { s: status, code }, type: Q.UPDATE });
  const redis = getRedis();
  if (redis) {
    try { await redis.set(`region:health:${code}`, JSON.stringify({ ...m, status }), 'EX', 120); } catch (err) { logger.error('[edge] publish failed:', err.message); }
  }
  edgeMetrics.setRegionHealth(code, { ...m, status });
  return { code, status };
}

module.exports = { pickRegion, listRegions, upsertRegion, recordHealth, CONTINENT };
