'use strict';
/**
 * Phase 6E-8 STEP 6 — Redis legacy HS256 artifact cleanup. DEFAULT: DRY-RUN.
 *
 * Purges Redis keys that are only meaningful under the legacy HS256 auth model:
 *   auth:blacklist:hs256:*       — HS256 token blacklist entries
 *   auth:trace:hs256:*           — legacy HS256 trace keys (pre-6E-6.5 schema)
 *   auth:rate:hs256:*            — HS256 rate-limit buckets (if any)
 *
 * Reports but does NOT delete:
 *   bff:session:*  with legacy_auth:true   — sessions drain naturally as users re-authenticate
 *   auth:burnin:*                          — burn-in data is an audit record; archive separately
 *   auth:trace:prod:*                      — production telemetry; never delete
 *   auth:trace:sim:*                       — simulation telemetry; never delete
 *
 * Usage:
 *   node scripts/decommissionCleanup.js             # dry-run
 *   node scripts/decommissionCleanup.js --apply     # delete legacy keys
 *   node scripts/decommissionCleanup.js --sessions  # include legacy session count in report (read-only always)
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

const APPLY    = process.argv.includes('--apply');
const SESSIONS = process.argv.includes('--sessions');

// Legacy key patterns to delete (APPLY mode only)
const PURGE_PATTERNS = [
  'auth:blacklist:hs256:*',
  'auth:trace:hs256:*',
  'auth:rate:hs256:*',
];

// Keys to report but never delete
const PRESERVE_PREFIXES = [
  'bff:session:',
  'auth:burnin:',
  'auth:trace:prod:',
  'auth:trace:sim:',
  'auth:trace:counters:',
];

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
  if (!r) { console.error('decommissionCleanup: Redis unavailable'); process.exit(1); }

  const result = {
    tool: 'decommissionCleanup',
    mode: APPLY ? 'APPLY' : 'DRY-RUN',
    generated_at: new Date().toISOString(),
    phase: '6E-8',
    purge_patterns: PURGE_PATTERNS,
    found: {},
    deleted: {},
    preserved_info: {},
    total_purged: 0,
    total_preserved: 0,
  };

  // ---- scan patterns to purge ----
  for (const pattern of PURGE_PATTERNS) {
    const keys = await scanKeys(r, pattern);
    result.found[pattern] = keys.length;
    result.deleted[pattern] = 0;

    if (keys.length > 0 && APPLY) {
      // Delete in batches of 100
      for (let i = 0; i < keys.length; i += 100) {
        const batch = keys.slice(i, i + 100);
        await r.del(...batch);
        result.deleted[pattern] += batch.length;
      }
    }
    result.total_purged += APPLY ? result.deleted[pattern] : 0;
  }

  // ---- session inventory (read-only even with --apply) ----
  if (SESSIONS) {
    const sessionKeys = await scanKeys(r, 'bff:session:*');
    const sessionSources = sessionKeys.filter((k) => !k.includes(':shadow:'));
    let gwIssued = 0, legacyAnnotated = 0, unannotated = 0;
    for (const k of sessionSources) {
      const raw = await r.get(k);
      if (!raw) continue;
      let s;
      try { s = JSON.parse(raw); } catch { continue; }
      if (s.gateway_issued === true) { gwIssued++; continue; }
      if (s.legacy_auth === true) { legacyAnnotated++; continue; }
      unannotated++;
    }
    result.preserved_info['bff:session:*'] = {
      total: sessionSources.length,
      gateway_issued: gwIssued,
      legacy_auth_annotated: legacyAnnotated,
      unannotated_legacy: unannotated,
      note: 'Sessions preserved — drain naturally as users re-authenticate via RS256/gateway',
    };
    result.total_preserved += sessionSources.length;
  }

  // ---- burn-in data summary (always include key count) ----
  const burninKeys = await scanKeys(r, 'auth:burnin:*');
  result.preserved_info['auth:burnin:*'] = {
    key_count: burninKeys.length,
    keys: burninKeys,
    note: 'Burn-in audit data preserved — archive to auth-migration/ before manual deletion',
  };
  result.total_preserved += burninKeys.length;

  // ---- summary ----
  const totalFound = Object.values(result.found).reduce((a, b) => a + b, 0);
  result.note = APPLY
    ? `${result.total_purged} legacy HS256 keys deleted; ${result.total_preserved} audit/session keys preserved`
    : `DRY-RUN: ${totalFound} legacy keys WOULD be deleted; pass --apply to purge`;

  if (!APPLY && totalFound === 0) {
    result.note = 'No legacy HS256 artifact keys found — Redis is clean';
  }

  console.log(JSON.stringify(result, null, 2));
  await r.quit();
  process.exit(0);
})().catch((e) => { console.error('decommissionCleanup error:', e.message); process.exit(1); });
