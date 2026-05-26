'use strict';

/**
 * White-label branding: custom domain, logo/colors, support/login pages, email
 * sender. resolveByDomain() powers the public custom login page; getForOrg/upsert
 * are admin-managed.
 */

const db = require('../models');
const complianceAudit = require('./complianceAudit');

const Q = db.Sequelize.QueryTypes;

async function getForOrg(orgId) {
  const [c] = await db.sequelize.query(`SELECT * FROM white_label_configs WHERE org_id = :org`, { replacements: { org: orgId }, type: Q.SELECT });
  return c || null;
}

async function resolveByDomain(domain) {
  if (!domain) return null;
  const [c] = await db.sequelize.query(
    `SELECT org_id, domain, brand_name, logo_url, primary_color, support_email, login_bg_url, custom_css
     FROM white_label_configs WHERE domain = :d AND enabled = true`,
    { replacements: { d: domain.toLowerCase() }, type: Q.SELECT },
  );
  return c || null; // public-safe subset only
}

async function upsert({ orgId, config, actorId }) {
  await db.sequelize.query(
    `INSERT INTO white_label_configs (org_id, domain, brand_name, logo_url, primary_color, support_email, login_bg_url, custom_css, email_from, enabled)
     VALUES (:org, :domain, :brand, :logo, :color, :support, :bg, :css, :from, :enabled)
     ON CONFLICT (org_id) DO UPDATE SET domain=EXCLUDED.domain, brand_name=EXCLUDED.brand_name, logo_url=EXCLUDED.logo_url,
       primary_color=EXCLUDED.primary_color, support_email=EXCLUDED.support_email, login_bg_url=EXCLUDED.login_bg_url,
       custom_css=EXCLUDED.custom_css, email_from=EXCLUDED.email_from, enabled=EXCLUDED.enabled`,
    { replacements: {
        org: orgId, domain: (config.domain || '').toLowerCase() || null, brand: config.brandName || null,
        logo: config.logoUrl || null, color: config.primaryColor || null, support: config.supportEmail || null,
        bg: config.loginBgUrl || null, css: config.customCss || null, from: config.emailFrom || null,
        enabled: config.enabled !== false,
      }, type: Q.INSERT },
  );
  await complianceAudit.log({ domain: 'access', action: 'white_label.upsert', orgId, actorId });
  return { ok: true };
}

// ── Custom domains (white_label_domains, migration 026) ─────────────────────────
const crypto = require('crypto');

async function listDomains(orgId) {
  return db.sequelize.query(
    `SELECT id, domain, verified, cert_status, created_at FROM white_label_domains WHERE org_id = :org ORDER BY created_at DESC`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
}

async function addDomain({ orgId, domain, actorId }) {
  const token = `baalvion-verify=${crypto.randomBytes(16).toString('hex')}`;
  const [row] = await db.sequelize.query(
    `INSERT INTO white_label_domains (org_id, domain, verify_token) VALUES (:org, :domain, :token)
     ON CONFLICT (domain) DO UPDATE SET verify_token = EXCLUDED.verify_token RETURNING id, verify_token`,
    { replacements: { org: orgId, domain: String(domain).toLowerCase(), token }, type: Q.SELECT },
  );
  await complianceAudit.log({ domain: 'access', action: 'white_label.domain_add', orgId, actorId, payload: { domain } }).catch(() => {});
  return { id: row.id, domain, verifyToken: row.verify_token, instructions: `Add a DNS TXT record: ${row.verify_token}` };
}

/** Mark a domain verified (a real impl resolves the DNS TXT record server-side first). */
async function verifyDomain({ id, orgId }) {
  await db.sequelize.query(
    `UPDATE white_label_domains SET verified = true, cert_status = 'issued' WHERE id = :id AND org_id = :org`,
    { replacements: { id, org: orgId }, type: Q.UPDATE },
  );
  return { id, verified: true };
}

module.exports = { getForOrg, resolveByDomain, upsert, listDomains, addDomain, verifyDomain };
