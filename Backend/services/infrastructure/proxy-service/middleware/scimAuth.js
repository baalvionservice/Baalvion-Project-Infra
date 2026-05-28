'use strict';

/**
 * SCIM bearer-token authentication. The IdP sends a per-org SCIM token; we store
 * only its SHA-256 hash. On success, req.scimOrg = the org id. SCIM errors use
 * the SCIM Error schema.
 */

const crypto = require('crypto');
const db = require('../models');

const Q = db.Sequelize.QueryTypes;
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

async function scimAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : null;
  if (!token) return scimErr(res, 401, 'missing bearer token');
  try {
    const [row] = await db.sequelize.query(
      `SELECT org_id FROM scim_tokens WHERE token_hash = :h AND revoked_at IS NULL`,
      { replacements: { h: sha256(token) }, type: Q.SELECT },
    );
    if (!row) return scimErr(res, 401, 'invalid SCIM token');
    req.scimOrg = row.org_id;
    return next();
  } catch (err) {
    return scimErr(res, 500, err.message);
  }
}

function scimErr(res, status, detail) {
  return res.status(status).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: String(status), detail });
}

module.exports = scimAuth;
module.exports.scimErr = scimErr;
