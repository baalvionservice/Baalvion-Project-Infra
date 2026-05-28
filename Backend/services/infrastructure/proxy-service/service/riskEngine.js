'use strict';

/**
 * Dynamic risk-scoring engine.
 *
 * computeRisk() is a PURE function (no I/O) so it is unit-testable and auditable.
 * evaluateOrg() gathers signals, persists a score, and drives enforcement when
 * the level warrants it.
 *
 * Score 0–100 (higher = riskier) → LOW / MEDIUM / HIGH / CRITICAL.
 */

const db = require('../models');
const complianceAudit = require('./complianceAudit');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

// Weighted signal contributions (cap each so no single signal dominates).
const WEIGHTS = {
  disposableEmail: 15,
  torOrVpnSignup: 12,
  geoPaymentMismatch: 18,
  failedPaymentVelocity: 20,   // scaled by count
  signupVelocityFromIp: 12,    // scaled by count
  abuseReports: 25,            // scaled by count
  lowAsnReputation: 15,        // scaled by (100-rep)/100
  sanctionsHit: 60,
  pepHit: 20,
  kycRejected: 40,
  kycUnverified: 10,
};

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

/**
 * @param {object} s signals
 * @returns {{score:number, level:string, reasons:string[], actions:string[]}}
 */
function computeRisk(s = {}) {
  let score = 0;
  const reasons = [];
  const add = (pts, why) => { if (pts > 0) { score += pts; reasons.push(why); } };

  if (s.disposableEmail) add(WEIGHTS.disposableEmail, 'disposable_email');
  if (s.torOrVpnSignup) add(WEIGHTS.torOrVpnSignup, 'tor_or_vpn_signup');
  if (s.geoPaymentMismatch) add(WEIGHTS.geoPaymentMismatch, 'geo_payment_mismatch');
  if (s.sanctionsHit) add(WEIGHTS.sanctionsHit, 'sanctions_hit');
  if (s.pepHit) add(WEIGHTS.pepHit, 'pep_hit');
  if (s.kycStatus === 'rejected') add(WEIGHTS.kycRejected, 'kyc_rejected');
  else if (s.kycStatus === 'unverified' || s.kycStatus == null) add(WEIGHTS.kycUnverified, 'kyc_unverified');

  add(clamp((s.failedPaymentVelocity || 0) * 5, 0, WEIGHTS.failedPaymentVelocity), 'failed_payment_velocity');
  add(clamp((s.signupVelocityFromIp || 0) * 4, 0, WEIGHTS.signupVelocityFromIp), 'signup_velocity');
  add(clamp((s.abuseReports || 0) * 10, 0, WEIGHTS.abuseReports), 'abuse_reports');
  if (typeof s.asnReputation === 'number' && s.asnReputation < 80) {
    add(clamp(((100 - s.asnReputation) / 100) * WEIGHTS.lowAsnReputation, 0, WEIGHTS.lowAsnReputation), 'low_asn_reputation');
  }

  score = clamp(Math.round(score), 0, 100);
  let level = score >= 80 ? 'critical' : score >= 55 ? 'high' : score >= 30 ? 'medium' : 'low';
  // Sanctions/blocklist match is a hard legal stop — always critical (auto-suspend).
  if (s.sanctionsHit) level = 'critical';
  const actions = {
    critical: ['suspend', 'manual_review'],
    high: ['throttle', 'manual_review'],
    medium: ['monitor'],
    low: [],
  }[level];

  return { score, level, reasons, actions };
}

// ── Signal gathering (real reads) ─────────────────────────────────────────────
const DISPOSABLE = new Set((process.env.DISPOSABLE_EMAIL_DOMAINS || 'mailinator.com,guerrillamail.com,10minutemail.com,tempmail.com,trashmail.com').split(','));

async function gatherSignals(orgId) {
  const [org] = await db.sequelize.query(
    `SELECT o.kyc_status, (SELECT email FROM users WHERE org_id = o.id ORDER BY id LIMIT 1) AS email
     FROM organizations o WHERE o.id = :org`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
  const email = org ? org.email : null;
  const [{ n: failed } = { n: 0 }] = await db.sequelize.query(
    `SELECT COUNT(*) AS n FROM invoices WHERE org_id = :org AND status = 'failed' AND issued_at > now() - interval '24 hours'`,
    { replacements: { org: orgId }, type: Q.SELECT },
  ).catch(() => [{ n: 0 }]);
  const [{ n: abuse } = { n: 0 }] = await db.sequelize.query(
    `SELECT COUNT(*) AS n FROM abuse_logs WHERE org_id = :org AND resolved = false`,
    { replacements: { org: orgId }, type: Q.SELECT },
  ).catch(() => [{ n: 0 }]);
  const [kyc] = await db.sequelize.query(
    `SELECT sanctions_hit, pep_hit FROM kyc_verifications WHERE org_id = :org ORDER BY created_at DESC LIMIT 1`,
    { replacements: { org: orgId }, type: Q.SELECT },
  ).catch(() => [null]);

  return {
    disposableEmail: email ? DISPOSABLE.has(String(email).split('@')[1]) : false,
    kycStatus: org ? org.kyc_status : 'unverified',
    failedPaymentVelocity: Number(failed) || 0,
    abuseReports: Number(abuse) || 0,
    sanctionsHit: kyc ? kyc.sanctions_hit : false,
    pepHit: kyc ? kyc.pep_hit : false,
  };
}

/** Recompute risk for an org, persist, audit, and trigger enforcement on high/critical. */
async function evaluateOrg(orgId, extraSignals = {}) {
  const signals = { ...(await gatherSignals(orgId)), ...extraSignals };
  const result = computeRisk(signals);

  await db.sequelize.query(
    `INSERT INTO risk_scores (org_id, score, level, signals) VALUES (:org, :score, :level, :signals::jsonb)`,
    { replacements: { org: orgId, score: result.score, level: result.level, signals: JSON.stringify({ ...signals, reasons: result.reasons }) }, type: Q.INSERT },
  );
  await db.organizations.update({ risk_level: result.level }, { where: { id: orgId } });
  await complianceAudit.log({ domain: 'risk', action: 'score', orgId, payload: result });

  if (result.actions.includes('suspend') || result.actions.includes('throttle')) {
    try {
      const enforcement = require('./enforcementService');
      const action = result.actions.includes('suspend') ? 'suspend' : 'throttle';
      await enforcement.apply({ orgId, action, reason: `risk:${result.level}:${result.reasons.join(',')}`, autoBy: 'risk-engine' });
    } catch (err) {
      logger.error('[risk] enforcement failed:', err.message);
    }
  }
  return result;
}

module.exports = { computeRisk, evaluateOrg, gatherSignals };
