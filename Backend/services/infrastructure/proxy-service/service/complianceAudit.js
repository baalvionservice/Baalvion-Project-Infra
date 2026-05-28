'use strict';

/**
 * Signed, append-only compliance audit log (kyc | moderation | gdpr |
 * enforcement | access | risk). Rows cannot be updated/deleted (DB trigger).
 * Each row is HMAC-signed so tampering is detectable even by a DB admin.
 */

const crypto = require('crypto');
const db = require('../models');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const SECRET = process.env.COMPLIANCE_SIGNING_SECRET || require('@baalvion/auth-node').requireEnv('BILLING_SIGNING_SECRET'); // fail-closed: prefer COMPLIANCE, else require BILLING; no weak default

function sign(row) {
  return crypto.createHmac('sha256', SECRET).update(JSON.stringify(row)).digest('hex');
}

/**
 * @param {object} e { domain, action, orgId?, actorId?, payload? }
 */
async function log(e) {
  try {
    const row = {
      domain: e.domain, action: e.action,
      org: e.orgId || null, actor: e.actorId != null ? Number(e.actorId) : null,
      payload: e.payload || {}, ts: Date.now(),
    };
    await db.sequelize.query(
      `INSERT INTO compliance_audit_logs (org_id, actor_id, domain, action, payload, signature)
       VALUES (NULLIF(:org,'')::uuid, :actor, :domain, :action, :payload::jsonb, :sig)`,
      { replacements: { org: row.org, actor: row.actor, domain: row.domain, action: row.action, payload: JSON.stringify(row.payload), sig: sign(row) }, type: Q.INSERT },
    );
  } catch (err) {
    logger.error('[compliance-audit] write failed:', err.message);
  }
}

module.exports = { log };
