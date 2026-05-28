'use strict';
/**
 * Phase 6E-6 STEP 2 — dual-auth consistency checker. READ-ONLY; never blocks traffic.
 *
 * Per user, compares the identity observed via the gateway vs via legacy HS256 (island) and reports
 * identity mismatches (userId/orgId), role-hierarchy drift, tenant-mapping inconsistencies (GTI:
 * org_id ↔ tenantId), and orphans (a user seen via only one source).
 *
 * Source: the live `auth:trace:recent` stream (default) or a `--fixture <file.json>` array of events.
 * Exports `analyze(events)` so the risk model (STEP 6) reuses the exact same logic.
 */
const fs = require('fs');
const authTrace = require('../observability/authTrace');

// Effective-privilege ranking — drift = the two sources resolve a DIFFERENT max privilege.
const RANK = { super_admin: 100, owner: 90, admin: 80, manager: 60, editor: 50, analyst: 45, member: 40, client: 20, viewer: 15, guest: 0 };
const rankOf = (roles = []) => (roles.length ? roles.reduce((m, r) => Math.max(m, RANK[String(r).toLowerCase()] ?? 10), 0) : 0);

function analyze(events) {
  const byUser = new Map();
  for (const e of events) {
    if (!e || !e.userId) continue;
    const u = byUser.get(e.userId) || { userId: e.userId, gateway: null, hs256: null, authservice: null };
    if (e.auth_source === 'gateway') u.gateway = e;
    else if (e.auth_source === 'island-hs256') u.hs256 = e;
    else if (e.auth_source === 'auth-service') u.authservice = e;
    byUser.set(e.userId, u);
  }
  const identityMismatches = [], roleHierarchyDrift = [], tenantInconsistencies = [], orphanSessions = [];
  let compared = 0;
  for (const u of byUser.values()) {
    const g = u.gateway, h = u.hs256;
    if (g && h) {
      compared++;
      if (String(g.orgId ?? '') !== String(h.orgId ?? '')) {
        identityMismatches.push({ userId: u.userId, field: 'orgId', gateway: g.orgId, hs256: h.orgId });
        tenantInconsistencies.push({ userId: u.userId, gatewayTenant: g.orgId, hs256Tenant: h.orgId });
      }
      const rg = rankOf(g.roles), rh = rankOf(h.roles);
      if (rg !== rh) roleHierarchyDrift.push({ userId: u.userId, gatewayRoles: g.roles, hs256Roles: h.roles, gatewayRank: rg, hs256Rank: rh });
    } else if (g || h) {
      orphanSessions.push({ userId: u.userId, seenVia: g ? 'gateway-only' : 'hs256-only' });
    }
  }
  return {
    usersObserved: byUser.size,
    comparedBothSources: compared,
    identityMismatches, roleHierarchyDrift, tenantInconsistencies, orphanSessions,
    mismatchRate: compared ? +(identityMismatches.length / compared).toFixed(4) : 0,
    driftRate: compared ? +(roleHierarchyDrift.length / compared).toFixed(4) : 0,
    tenantMismatchRate: compared ? +(tenantInconsistencies.length / compared).toFixed(4) : 0,
  };
}

async function loadEvents() {
  const fix = process.argv.indexOf('--fixture');
  if (fix > -1) return JSON.parse(fs.readFileSync(process.argv[fix + 1], 'utf8'));
  return authTrace.getRecentRedis(2000, 'production');
}

if (require.main === module) {
  (async () => {
    const fix = process.argv.indexOf('--fixture') > -1;
    const report = analyze(await loadEvents());
    console.log(JSON.stringify({ tool: 'authConsistencyCheck', readOnly: true, source: fix ? 'fixture' : 'redis:auth:trace:prod:recent', ...report }, null, 2));
    process.exit(0);
  })().catch((e) => { console.error('authConsistencyCheck error:', e.message); process.exit(1); });
}

module.exports = { analyze, rankOf, loadEvents };
