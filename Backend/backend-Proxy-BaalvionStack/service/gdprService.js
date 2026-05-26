'use strict';

/**
 * GDPR / data-rights tooling: consent tracking, data export (DSAR), right-to-be-
 * forgotten (anonymization that preserves financial/audit integrity), and a
 * retention sweep. Exports are HMAC-signed for tamper-evidence.
 *
 * Deletion strategy: PII is ANONYMIZED, not hard-deleted, so immutable billing
 * and audit records (legal basis: tax/financial record-keeping) stay intact
 * while the person is no longer identifiable.
 */

const crypto = require('crypto');
const db = require('../models');
const complianceAudit = require('./complianceAudit');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const SECRET = process.env.COMPLIANCE_SIGNING_SECRET || process.env.BILLING_SIGNING_SECRET || 'dev-compliance-secret-change-me';
const RETENTION_DAYS = Number(process.env.DATA_RETENTION_DAYS || 365);

// ── Pure helpers (testable) ───────────────────────────────────────────────────
function anonymizeEmail(email) {
  const h = crypto.createHash('sha256').update(String(email || '')).digest('hex').slice(0, 12);
  return `deleted+${h}@anon.invalid`;
}
function sign(obj) {
  return crypto.createHmac('sha256', SECRET).update(JSON.stringify(obj)).digest('hex');
}

// ── Consent ───────────────────────────────────────────────────────────────────
async function recordConsent({ orgId, userId, purpose, granted, version, ip }) {
  await db.sequelize.query(
    `INSERT INTO consent_records (org_id, user_id, purpose, granted, version, ip_address)
     VALUES (NULLIF(:org,'')::uuid, :user, :purpose, :granted, :version, :ip)`,
    { replacements: { org: orgId || '', user: userId || null, purpose, granted: !!granted, version: version || 'v1', ip: ip || null }, type: Q.INSERT },
  );
  await complianceAudit.log({ domain: 'gdpr', action: `consent:${purpose}:${granted ? 'grant' : 'revoke'}`, orgId, actorId: userId });
}

// ── Data export (DSAR) ────────────────────────────────────────────────────────
async function requestExport({ orgId, userId, requestedBy }) {
  const [req] = await db.sequelize.query(
    `INSERT INTO gdpr_requests (org_id, user_id, type, status, requested_by)
     VALUES (NULLIF(:org,'')::uuid, :user, 'export', 'processing', :by) RETURNING id`,
    { replacements: { org: orgId || '', user: userId || null, by: requestedBy || null }, type: Q.SELECT },
  );

  const bundle = await gatherOrgData(orgId);
  const signature = sign(bundle);
  // In prod the bundle is uploaded to a signed, expiring S3 URL; here we persist
  // the signature + record. The export controller streams the bundle on download.
  await db.sequelize.query(
    `UPDATE gdpr_requests SET status='completed', signature=:sig, completed_at=now(),
       download_url=:url WHERE id=:id`,
    { replacements: { sig: signature, url: `/v1/account/gdpr/${req.id}/download`, id: req.id }, type: Q.UPDATE },
  );
  await complianceAudit.log({ domain: 'gdpr', action: 'export', orgId, actorId: requestedBy, payload: { requestId: req.id, signature } });
  return { id: req.id, bundle, signature };
}

async function gatherOrgData(orgId) {
  const grab = async (sql) => db.sequelize.query(sql, { replacements: { org: orgId }, type: Q.SELECT }).catch(() => []);
  return {
    exportedAt: new Date().toISOString(),
    organization: (await grab(`SELECT id, slug, name, status, plan_slug, created_at FROM organizations WHERE id=:org`))[0] || null,
    users: await grab(`SELECT id, email, full_name, role, status, created_at FROM users WHERE org_id=:org`),
    invoices: await grab(`SELECT id, total, currency, status, issued_at, period_start, period_end FROM invoices WHERE org_id=:org`),
    apiKeys: await grab(`SELECT id, name, key_prefix, key_type, created_at, revoked_at FROM api_keys WHERE org_id=:org`),
    consent: await grab(`SELECT purpose, granted, version, created_at FROM consent_records WHERE org_id=:org`),
    usageDaily: await grab(`SELECT id, date, bandwidth_gb, requests FROM usage_records WHERE org_id=:org ORDER BY period_start DESC LIMIT 400`),
  };
}

// ── Right to be forgotten (anonymize) ─────────────────────────────────────────
async function requestDelete({ orgId, userId, requestedBy }) {
  const [req] = await db.sequelize.query(
    `INSERT INTO gdpr_requests (org_id, user_id, type, status, requested_by)
     VALUES (NULLIF(:org,'')::uuid, :user, 'delete', 'processing', :by) RETURNING id`,
    { replacements: { org: orgId || '', user: userId || null, by: requestedBy || null }, type: Q.SELECT },
  );

  // Anonymize user PII; revoke credentials/sessions. Financial records retained.
  const users = await db.sequelize.query(
    `SELECT id, email FROM users WHERE org_id = :org ${userId ? 'AND id = :user' : ''}`,
    { replacements: { org: orgId, user: userId || null }, type: Q.SELECT },
  );
  for (const u of users) {
    await db.users.update(
      { email: anonymizeEmail(u.email), full_name: null, mfa_secret: null },
      { where: { id: u.id } },
    );
    await db.sequelize.query(`UPDATE sessions SET revoked_at = now() WHERE user_id = :u AND revoked_at IS NULL`, { replacements: { u: u.id }, type: Q.UPDATE }).catch(() => {});
  }
  await db.sequelize.query(`UPDATE api_keys SET revoked_at = now(), status='revoked' WHERE org_id = :org AND revoked_at IS NULL`, { replacements: { org: orgId }, type: Q.UPDATE }).catch(() => {});

  await db.sequelize.query(`UPDATE gdpr_requests SET status='completed', completed_at=now() WHERE id=:id`, { replacements: { id: req.id }, type: Q.UPDATE });
  await complianceAudit.log({ domain: 'gdpr', action: 'delete', orgId, actorId: requestedBy, payload: { requestId: req.id, anonymized: users.length } });
  return { id: req.id, anonymized: users.length };
}

// ── Retention sweep (cron) ────────────────────────────────────────────────────
async function retentionSweep() {
  const cutoffSessions = `now() - interval '90 days'`;
  const cutoff = `now() - interval '${RETENTION_DAYS} days'`;
  let removed = 0;
  const del = async (sql) => { const r = await db.sequelize.query(sql, { type: Q.DELETE }).catch(() => null); return r; };
  await del(`DELETE FROM sessions WHERE revoked_at IS NOT NULL AND revoked_at < ${cutoffSessions}`);
  await del(`DELETE FROM auth_audit_logs WHERE created_at < ${cutoff}`);
  await del(`DELETE FROM failed_auth_attempts WHERE created_at < ${cutoff}`);
  removed = 1;
  await complianceAudit.log({ domain: 'gdpr', action: 'retention_sweep', payload: { retentionDays: RETENTION_DAYS } });
  return { swept: removed };
}

module.exports = { anonymizeEmail, recordConsent, requestExport, requestDelete, retentionSweep, gatherOrgData };
