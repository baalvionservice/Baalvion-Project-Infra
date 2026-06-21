'use strict';
/**
 * Phase 7 — multi-region status report. READ-ONLY.
 *
 * Reports: region config, JWKS + auth-service health, active session stats with geo distribution.
 *
 * Usage:
 *   node scripts/regionStatus.js
 *   node scripts/regionStatus.js --json
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

const config = require('../config/appConfig');

const JSON_MODE = process.argv.includes('--json');

let _redis;
function getRedis() {
  if (_redis !== undefined) return _redis;
  let M;
  try { M = require('ioredis'); }
  catch {
    try { M = require(process.env.IOREDIS_PATH || 'd:/Baalvion Projects/Backend/services/identity/auth-service/node_modules/ioredis'); }
    catch { _redis = null; return null; }
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

async function httpProbe(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return { ok: res.ok, status: res.status, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, status: null, error: e.message, latencyMs: Date.now() - start };
  }
}

async function getSessionStats(r) {
  if (!r) return { error: 'redis_unavailable' };
  try {
    const found = [];
    let cursor = '0';
    do {
      const [next, keys] = await r.scan(cursor, 'MATCH', 'bff:session:*', 'COUNT', 200);
      cursor = next;
      found.push(...keys.filter((k) => !k.includes(':shadow:')));
    } while (cursor !== '0');

    let gwIssued = 0, withGeo = 0, withStepUp = 0;
    const geoCounts = {};
    for (const k of found) {
      const raw = await r.get(k);
      if (!raw) continue;
      try {
        const s = JSON.parse(raw);
        if (s.gateway_issued === true) gwIssued++;
        if (s.geo && s.geo.country && s.geo.country !== 'unknown') {
          withGeo++;
          geoCounts[s.geo.country] = (geoCounts[s.geo.country] || 0) + 1;
        }
        const now = Math.floor(Date.now() / 1000);
        if (s.stepUpLevel === 'elevated' && s.stepUpExpiresAt > now) withStepUp++;
      } catch { /* skip malformed */ }
    }
    return { total: found.length, gateway_issued: gwIssued, with_geo: withGeo, with_step_up: withStepUp, geo_distribution: geoCounts };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  const start = Date.now();
  const r = getRedis();

  const regionConfig = {
    region:         config.region,
    workloadId:     config.workloadId,
    geoEnforcement: config.geoEnforcement,
    envelopeTtl:    config.envelopeTtl,
    enforcementMode: config.enforcementMode,
    burnInMode:      config.burnInMode,
    port:            config.port,
  };

  const authBase = (config.authServiceUrl || '').replace(/\/v1\/auth$/, '');
  const [jwksHealth, authHealth, sessionStats] = await Promise.all([
    httpProbe(config.jwksUri),
    httpProbe(`${authBase}/health`),
    getSessionStats(r),
  ]);

  let redisOk = false;
  try { redisOk = r ? (await r.ping()) === 'PONG' : false; } catch { /* */ }

  const report = {
    tool:         'regionStatus',
    readOnly:     true,
    phase:        '7',
    generated_at: new Date().toISOString(),
    duration_ms:  Date.now() - start,

    region_config: regionConfig,

    health: {
      redis:         { ok: redisOk },
      jwks_endpoint: { uri: config.jwksUri, ...jwksHealth },
      auth_service:  { uri: `${authBase}/health`, ...authHealth },
    },

    sessions: sessionStats,

    migration_phases: {
      A_shadow:    'Send v2 envelope alongside v1 headers (CURRENT)',
      B_log_only:  'Island bffBridge accepts v2; v1 still works',
      C_soft:      'Warn on v1 fallback (island observability)',
      D_hard:      'Reject v1 headers; v2 envelope required',
      E_retire:    'Remove v1 header injection from proxy',
      current:     'A_shadow',
    },
  };

  if (r) await r.quit();

  if (JSON_MODE) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  console.log('\n=== Auth Gateway — Region Status ===');
  console.log(`Generated : ${report.generated_at}`);
  console.log(`\nRegion Config:`);
  for (const [k, v] of Object.entries(regionConfig)) console.log(`  ${k.padEnd(18)}: ${v}`);
  console.log('\nHealth:');
  console.log(`  Redis         : ${redisOk ? 'OK' : 'UNAVAILABLE'}`);
  console.log(`  JWKS          : ${jwksHealth.ok ? `HTTP ${jwksHealth.status} (${jwksHealth.latencyMs}ms)` : `FAILED — ${jwksHealth.error || jwksHealth.status}`}`);
  console.log(`  Auth service  : ${authHealth.ok  ? `HTTP ${authHealth.status} (${authHealth.latencyMs}ms)` : `FAILED — ${authHealth.error  || authHealth.status}`}`);
  console.log('\nSessions:');
  if (sessionStats.error) {
    console.log(`  Error: ${sessionStats.error}`);
  } else {
    console.log(`  Total active  : ${sessionStats.total}`);
    console.log(`  Gateway-issued: ${sessionStats.gateway_issued}`);
    console.log(`  With geo data : ${sessionStats.with_geo}`);
    console.log(`  Step-up active: ${sessionStats.with_step_up}`);
    const dist = sessionStats.geo_distribution || {};
    if (Object.keys(dist).length > 0) {
      console.log(`  Geo distribution: ${Object.entries(dist).map(([c, n]) => `${c}=${n}`).join(', ')}`);
    }
  }
  console.log('\nMigration Phase: A_shadow (v2 envelope injected alongside v1 headers)');
  console.log('');
  process.exit(0);
})().catch((e) => { console.error('regionStatus error:', e.message); process.exit(1); });
