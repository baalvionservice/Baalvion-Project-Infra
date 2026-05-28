'use strict';
/**
 * Phase 6E-7 STEP 6 — legacy session annotation. Marks active gateway sessions that were
 * established via HS256 with legacy_auth:true, so post-cutover tooling can identify them.
 *
 * Reads  bff:session:<sid>  (original, never deleted or force-expired)
 * Writes bff:session:<sid>  with { legacy_auth: true } appended (same TTL, only if not already set)
 *
 * DEFAULT: DRY-RUN (no writes). Pass --apply to annotate.
 *
 * Usage:
 *   node scripts/legacySessionAnnotator.js           # dry-run
 *   node scripts/legacySessionAnnotator.js --apply   # write annotations
 */
const config = require('../config/appConfig');
const Redis  = require('ioredis');

const APPLY = process.argv.includes('--apply');
const redis = new Redis({ host: config.redis.host, port: config.redis.port, password: config.redis.password, maxRetriesPerRequest: 2 });
redis.on('error', () => {});

(async () => {
  const keys = await redis.keys('bff:session:*');
  const sources = keys.filter((k) => !k.includes(':shadow:'));

  const result = {
    tool: 'legacySessionAnnotator',
    mode: APPLY ? 'APPLY' : 'DRY-RUN',
    source_session_count: sources.length,
    already_legacy: [],
    annotated: [],
    skipped_no_parse: [],
    skipped_gateway: [],
  };

  for (const k of sources) {
    const sid = k.replace('bff:session:', '');
    const raw = await redis.get(k);
    if (!raw) { result.skipped_no_parse.push(sid); continue; }
    let session;
    try { session = JSON.parse(raw); } catch { result.skipped_no_parse.push(sid); continue; }

    // Sessions with gateway_issued flag (set by auth-gateway after strict mode) are not legacy.
    if (session.gateway_issued === true) { result.skipped_gateway.push(sid); continue; }
    // Already annotated.
    if (session.legacy_auth === true) { result.already_legacy.push(sid); continue; }

    if (APPLY) {
      const ttl = await redis.ttl(k);
      const updated = { ...session, legacy_auth: true, legacy_annotated_at: new Date().toISOString() };
      if (ttl && ttl > 0) await redis.set(k, JSON.stringify(updated), 'EX', ttl);
      else await redis.set(k, JSON.stringify(updated));
    }
    result.annotated.push({ sid, userId: session.userId ?? null, orgId: session.orgId ?? null });
  }

  result.note = APPLY
    ? `${result.annotated.length} sessions annotated with legacy_auth:true; originals preserved with same TTL`
    : `DRY-RUN: ${result.annotated.length} sessions WOULD be annotated; pass --apply to write`;
  console.log(JSON.stringify(result, null, 2));
  await redis.quit();
  process.exit(0);
})().catch((e) => { console.error('legacySessionAnnotator error:', e.message); try { redis.disconnect(); } catch {} process.exit(1); });
