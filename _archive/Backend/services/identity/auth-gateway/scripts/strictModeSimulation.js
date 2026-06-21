'use strict';
/**
 * Phase 6E-6 STEP 3 — ISLAND strict-mode SIMULATION (DRY-RUN). Nothing is ever rejected.
 *
 * Computes what `ISLAND_AUTH_MODE=strict` WOULD do once HS256 is retired, from observed traffic:
 * every accepted ISLAND request whose identity did NOT come from the gateway would be rejected
 * (it has no gateway-signed identity to fall back to). The gateway leg itself is always
 * RS256/auth-service and is excluded.
 *
 * Source: live `auth:trace:recent` (default) or `--fixture <file.json>`.
 */
const fs = require('fs');
const authTrace = require('../observability/authTrace');

(async () => {
  const fix = process.argv.indexOf('--fixture');
  const events = fix > -1 ? JSON.parse(fs.readFileSync(process.argv[fix + 1], 'utf8')) : await authTrace.getRecentRedis(2000, 'production');

  const island = events.filter((e) => e && e.service && e.service !== 'auth-gateway' && e.result === 'accept');
  const wouldAccept = island.filter((e) => e.auth_source === 'gateway');
  const wouldReject = island.filter((e) => e.auth_source !== 'gateway'); // HS256 + any non-gateway bearer
  const affected_users = [...new Set(wouldReject.map((e) => e.userId).filter(Boolean))];
  const total = island.length || 1;
  const rejRate = wouldReject.length / total;
  const lockout_risk = wouldReject.length === 0 ? 'LOW' : (rejRate < 0.2 ? 'MEDIUM' : 'HIGH');

  console.log(JSON.stringify({
    tool: 'strictModeSimulation',
    dryRun: true,
    note: 'SIMULATION ONLY — no request was rejected; strict mode is NOT enabled',
    islandAcceptedRequests: island.length,
    would_accept_gateway: wouldAccept.length,
    would_reject_hs256: wouldReject.length,
    would_reject_rate: +rejRate.toFixed(4),
    lockout_risk,
    affected_users,
  }, null, 2));
  process.exit(0);
})().catch((e) => { console.error('strictModeSimulation error:', e.message); process.exit(1); });
