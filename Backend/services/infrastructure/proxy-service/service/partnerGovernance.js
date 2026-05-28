'use strict';

/**
 * Enterprise partner governance — approval workflow, KYB (business KYC), regional
 * restrictions and contract lifecycle. Reuses the trust kycService (Prompt 7) for
 * KYB. Pure region-restriction check is unit-tested.
 */

const db = require('../models');
const complianceAudit = require('./complianceAudit');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

let kycService = null;
try { kycService = require('./kycService'); } catch (_) { kycService = null; }

/** PURE: is a country allowed given a reseller's regional restrictions? */
function isRegionAllowed(restrictions, country) {
  if (!restrictions || restrictions.length === 0) return true; // unrestricted
  const c = String(country || '').toLowerCase();
  // Restriction entries prefixed with '!' are denies; otherwise the list is an allowlist.
  const denies = restrictions.filter((r) => r.startsWith('!')).map((r) => r.slice(1).toLowerCase());
  if (denies.includes(c)) return false;
  const allows = restrictions.filter((r) => !r.startsWith('!')).map((r) => r.toLowerCase());
  return allows.length === 0 ? true : allows.includes(c);
}

async function submitForApproval(resellerId) {
  await db.sequelize.query(`UPDATE reseller_orgs SET kyb_status = 'pending' WHERE id = :id`, { replacements: { id: resellerId }, type: Q.UPDATE });
  return { resellerId, kybStatus: 'pending' };
}

/** Start KYB via the trust KYC service (subject_type = business). */
async function startKyb({ resellerId, orgId }) {
  if (!kycService) return { ok: false, reason: 'kyc_service_unavailable' };
  try {
    const r = await kycService.startVerification({ orgId, subjectType: 'business', level: 'kyb' });
    return { ok: true, ...r };
  } catch (err) { logger.error('[governance] kyb start:', err.message); return { ok: false, reason: err.message }; }
}

async function approveReseller({ resellerId, approver, kybApproved = true }) {
  await db.sequelize.query(
    `UPDATE reseller_orgs SET status = 'active', kyb_status = :kyb, approved_by = :by WHERE id = :id`,
    { replacements: { id: resellerId, kyb: kybApproved ? 'approved' : 'rejected', by: approver || null }, type: Q.UPDATE },
  );
  await complianceAudit.log({ domain: 'access', action: 'reseller.approve', actorId: approver, payload: { resellerId, kybApproved } }).catch(() => {});
  return { resellerId, status: 'active', kybStatus: kybApproved ? 'approved' : 'rejected' };
}

async function setContract({ resellerId, terms, regionalRestrictions = [], auditRequired = false }) {
  const [row] = await db.sequelize.query(
    `INSERT INTO partner_contracts (reseller_id, terms, regional_restrictions, audit_required, status, signed_at)
     VALUES (:id, :terms::jsonb, :rr, :audit, 'active', now()) RETURNING id`,
    { replacements: { id: resellerId, terms: JSON.stringify(terms || {}), rr: regionalRestrictions, audit: auditRequired }, type: Q.SELECT },
  );
  return { contractId: row.id, resellerId };
}

/** Enforce region restriction before a reseller provisions a customer in a country. */
async function assertRegionAllowed(resellerId, country) {
  const [c] = await db.sequelize.query(
    `SELECT regional_restrictions FROM partner_contracts WHERE reseller_id = :id AND status = 'active' ORDER BY signed_at DESC LIMIT 1`,
    { replacements: { id: resellerId }, type: Q.SELECT },
  ).catch(() => [null]);
  const allowed = isRegionAllowed(c?.regional_restrictions || [], country);
  if (!allowed) throw new Error(`region ${country} not permitted by partner contract`);
  return true;
}

module.exports = { isRegionAllowed, submitForApproval, startKyb, approveReseller, setContract, assertRegionAllowed };
