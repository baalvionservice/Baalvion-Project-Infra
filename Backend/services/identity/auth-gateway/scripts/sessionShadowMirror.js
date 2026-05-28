'use strict';
/**
 * Phase 6E-6 STEP 4 — session migration PREP. Mirrors gateway sessions into a parallel shadow
 * namespace so a future zero-lockout cutover can reconcile identities. DEFAULT = DRY-RUN (no writes).
 * It NEVER deletes or modifies the original `bff:session:<sid>`. Pass `--apply` to write shadows.
 *
 *   source: bff:session:<sid>                       (read-only, untouched)
 *   shadow: bff:session:shadow:<sid> = { ...session, shadowedAt,
 *             sources: { gateway:<sid>, hs256:null },   // HS256 islands are stateless → slot reserved
 *             mapping: { userId, orgId } }
 *
 * The shadow copy inherits the source TTL so it never outlives the real session.
 */
const config = require('../config/appConfig');
const Redis = require('ioredis');

const APPLY = process.argv.includes('--apply');
const redis = new Redis({ host: config.redis.host, port: config.redis.port, password: config.redis.password, maxRetriesPerRequest: 2 });
redis.on('error', () => { /* reported below */ });

(async () => {
  const keys = await redis.keys('bff:session:*');
  const sources = keys.filter((k) => !k.includes(':shadow:'));
  const out = { tool: 'sessionShadowMirror', mode: APPLY ? 'APPLY' : 'DRY-RUN', sourceSessions: sources.length, mirrored: [], skipped: [] };
  for (const k of sources) {
    const sid = k.replace('bff:session:', '');
    const raw = await redis.get(k);
    if (!raw) { out.skipped.push({ sid, reason: 'empty' }); continue; }
    let s; try { s = JSON.parse(raw); } catch { out.skipped.push({ sid, reason: 'unparseable' }); continue; }
    const ttl = await redis.ttl(k);
    const shadow = {
      ...s,
      shadowedAt: new Date().toISOString(),
      sources: { gateway: sid, hs256: null },
      mapping: { userId: s.userId, orgId: s.orgId ?? null },
    };
    if (APPLY) {
      const shadowKey = `bff:session:shadow:${sid}`;
      if (ttl && ttl > 0) await redis.set(shadowKey, JSON.stringify(shadow), 'EX', ttl);
      else await redis.set(shadowKey, JSON.stringify(shadow));
    }
    out.mirrored.push({ sid, userId: s.userId, orgId: s.orgId ?? null, ttl });
  }
  out.note = APPLY ? 'shadow keys written; ORIGINAL sessions left untouched' : 'DRY-RUN: nothing written (pass --apply to mirror)';
  console.log(JSON.stringify(out, null, 2));
  await redis.quit();
  process.exit(0);
})().catch((e) => { console.error('sessionShadowMirror error:', e.message); try { redis.disconnect(); } catch { /* */ } process.exit(1); });
