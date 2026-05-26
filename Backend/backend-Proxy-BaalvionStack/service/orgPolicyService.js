'use strict';

/**
 * Organization policy engine: MFA-required, IP allowlist, geo restriction, API
 * restriction, billing approval. Policies are evaluated in middleware (control
 * plane) and — for geo — published to Redis for the gateway via enforcementService.
 */

const db = require('../models');
const complianceAudit = require('./complianceAudit');

const Q = db.Sequelize.QueryTypes;

async function getPolicies(orgId) {
  const rows = await db.sequelize.query(
    `SELECT policy_type, config, enabled FROM org_policies WHERE org_id = :org AND enabled = true`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
  const out = {};
  for (const r of rows) out[r.policy_type] = r.config || {};
  return out;
}

async function setPolicy({ orgId, policyType, config, enabled = true, actorId }) {
  await db.sequelize.query(
    `INSERT INTO org_policies (org_id, policy_type, config, enabled) VALUES (:org, :type, :cfg::jsonb, :enabled)
     ON CONFLICT (org_id, policy_type) DO UPDATE SET config = EXCLUDED.config, enabled = EXCLUDED.enabled`,
    { replacements: { org: orgId, type: policyType, cfg: JSON.stringify(config || {}), enabled }, type: Q.INSERT },
  );
  // Geo restriction is enforced at the gateway → push through the enforcement engine.
  if (policyType === 'geo_restrict') {
    try {
      const enforcement = require('./enforcementService');
      await enforcement.apply({ orgId, action: 'geo_restrict', params: config, reason: 'org_policy', createdBy: actorId });
    } catch (_) {}
  }
  await complianceAudit.log({ domain: 'access', action: `policy:${policyType}`, orgId, actorId, payload: { enabled } });
  return { policyType, enabled };
}

// ── Enforcement helpers (used by middleware) ──────────────────────────────────
function ipAllowed(policies, ip) {
  const cfg = policies.ip_allowlist;
  if (!cfg || !Array.isArray(cfg.cidrs) || cfg.cidrs.length === 0) return true;
  return cfg.cidrs.some((cidr) => cidrMatch(ip, cidr));
}

function mfaRequired(policies) { return !!(policies.mfa_required && policies.mfa_required.enabled !== false); }

// Minimal IPv4 CIDR match (control-plane allowlists). IPv6 → allow (documented).
function cidrMatch(ip, cidr) {
  if (!ip || !cidr) return false;
  if (!cidr.includes('/')) return ip === cidr;
  const [range, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  const toInt = (a) => a.split('.').reduce((acc, o) => (acc << 8) + (parseInt(o, 10) & 255), 0) >>> 0;
  if (ip.includes(':') || range.includes(':')) return true; // IPv6 not enforced here
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (toInt(ip) & mask) === (toInt(range) & mask);
}

module.exports = { getPolicies, setPolicy, ipAllowed, mfaRequired, cidrMatch };
