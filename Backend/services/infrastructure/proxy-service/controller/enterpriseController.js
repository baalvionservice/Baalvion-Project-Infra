'use strict';

/**
 * Enterprise self-service (org admins). SSO config, SCIM tokens, custom roles,
 * org policies, org units, SLA, white-label, audit export + SIEM sinks.
 * Scoped to req.auth.organizationId; secrets encrypted at rest.
 */

const crypto = require('crypto');
const db = require('../models');
const cryptoVault = require('../service/cryptoVault');
const rbacService = require('../service/rbacService');
const orgPolicy = require('../service/orgPolicyService');
const slaService = require('../service/slaService');
const whiteLabel = require('../service/whiteLabelService');
const auditExport = require('../service/auditExportService');
const metrics = require('../observability/enterpriseMetrics');
const { sendSuccess } = require('../utils/response');

const Q = db.Sequelize.QueryTypes;
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const wrap = (h) => async (req, res, next) => { try { await h(req, res, next); } catch (e) { next(e); } };
const org = (req) => req.auth.organizationId;
const actor = (req) => req.auth.userId;

module.exports = {
  // ── SSO ──
  getSso: wrap(async (req, res) => {
    const [c] = await db.sequelize.query(
      `SELECT id, type, enabled, idp_entity_id, idp_sso_url, oidc_issuer, oidc_client_id, attribute_map, group_role_map, default_role
       FROM sso_connections WHERE org_id = :org`, { replacements: { org: org(req) }, type: Q.SELECT });
    sendSuccess(req, res, c || null); // secrets/cert never returned
  }),
  upsertSso: wrap(async (req, res) => {
    const b = req.body;
    const secretEnc = b.oidcClientSecret ? cryptoVault.encrypt(b.oidcClientSecret) : null;
    await db.sequelize.query(
      `INSERT INTO sso_connections (org_id, type, enabled, idp_entity_id, idp_sso_url, idp_cert, oidc_issuer, oidc_client_id, oidc_secret_enc, attribute_map, group_role_map, default_role)
       VALUES (:org,:type,:enabled,:eid,:sso,:cert,:iss,:cid,COALESCE(:sec, (SELECT oidc_secret_enc FROM sso_connections WHERE org_id=:org)),:amap::jsonb,:gmap::jsonb,:drole)
       ON CONFLICT (org_id) DO UPDATE SET type=EXCLUDED.type, enabled=EXCLUDED.enabled, idp_entity_id=EXCLUDED.idp_entity_id,
         idp_sso_url=EXCLUDED.idp_sso_url, idp_cert=COALESCE(EXCLUDED.idp_cert, sso_connections.idp_cert),
         oidc_issuer=EXCLUDED.oidc_issuer, oidc_client_id=EXCLUDED.oidc_client_id,
         oidc_secret_enc=COALESCE(EXCLUDED.oidc_secret_enc, sso_connections.oidc_secret_enc),
         attribute_map=EXCLUDED.attribute_map, group_role_map=EXCLUDED.group_role_map, default_role=EXCLUDED.default_role, updated_at=now()`,
      { replacements: { org: org(req), type: b.type, enabled: b.enabled !== false, eid: b.idpEntityId || null, sso: b.idpSsoUrl || null,
        cert: b.idpCert || null, iss: b.oidcIssuer || null, cid: b.oidcClientId || null, sec: secretEnc,
        amap: JSON.stringify(b.attributeMap || {}), gmap: JSON.stringify(b.groupRoleMap || {}), drole: b.defaultRole || 'viewer' }, type: Q.INSERT });
    sendSuccess(req, res, { ok: true, acsUrl: `${process.env.API_BASE_URL || ''}/v1/sso/saml/${org(req)}/acs`, metadataUrl: `${process.env.API_BASE_URL || ''}/v1/sso/saml/${org(req)}/metadata` });
  }),

  // ── SCIM tokens ──
  createScimToken: wrap(async (req, res) => {
    const raw = 'scim_' + crypto.randomBytes(24).toString('base64url');
    await db.sequelize.query(
      `INSERT INTO scim_tokens (org_id, token_hash, token_prefix, created_by) VALUES (:org, :h, :p, :by)`,
      { replacements: { org: org(req), h: sha256(raw), p: raw.slice(0, 12), by: actor(req) }, type: Q.INSERT });
    sendSuccess(req, res, { token: raw, baseUrl: `${process.env.API_BASE_URL || ''}/scim/v2`, message: 'Store this SCIM token now — it will not be shown again' }, 201);
  }),
  listScimTokens: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT id, token_prefix, created_at, revoked_at FROM scim_tokens WHERE org_id = :org ORDER BY created_at DESC`, { replacements: { org: org(req) }, type: Q.SELECT }))),
  revokeScimToken: wrap(async (req, res) => { await db.sequelize.query(`UPDATE scim_tokens SET revoked_at = now() WHERE id = :id AND org_id = :org`, { replacements: { id: req.params.id, org: org(req) }, type: Q.UPDATE }); sendSuccess(req, res, { revoked: true }); }),

  // ── Custom RBAC ──
  listRoles: wrap(async (req, res) => sendSuccess(req, res, await rbacService.listRoles(org(req)))),
  createRole: wrap(async (req, res) => sendSuccess(req, res, await rbacService.createRole({ orgId: org(req), name: req.body.name, description: req.body.description, inherits: req.body.inherits, permissions: req.body.permissions }), 201)),

  // ── Policies ──
  getPolicies: wrap(async (req, res) => sendSuccess(req, res, await orgPolicy.getPolicies(org(req)))),
  setPolicy: wrap(async (req, res) => sendSuccess(req, res, await orgPolicy.setPolicy({ orgId: org(req), policyType: req.body.policyType, config: req.body.config, enabled: req.body.enabled, actorId: actor(req) }))),

  // ── Org units ──
  listOrgUnits: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT id, parent_id, type, name, delegated_admin_user_id, quota_gb FROM org_units WHERE org_id = :org ORDER BY type, name`, { replacements: { org: org(req) }, type: Q.SELECT }))),
  createOrgUnit: wrap(async (req, res) => {
    const [u] = await db.sequelize.query(
      `INSERT INTO org_units (org_id, parent_id, type, name, delegated_admin_user_id, quota_gb)
       VALUES (:org, NULLIF(:parent,'')::uuid, :type, :name, :admin, :quota) RETURNING id`,
      { replacements: { org: org(req), parent: req.body.parentId || '', type: req.body.type || 'team', name: req.body.name, admin: req.body.delegatedAdminUserId || null, quota: req.body.quotaGb || null }, type: Q.SELECT });
    sendSuccess(req, res, u, 201);
  }),

  // ── SLA ──
  getSla: wrap(async (req, res) => sendSuccess(req, res, { definition: await slaService.getDefinition(org(req)), periods: await slaService.listPeriods(org(req)) })),
  setSla: wrap(async (req, res) => {
    const b = req.body;
    await db.sequelize.query(
      `INSERT INTO sla_definitions (org_id, tier, uptime_target, latency_target_ms, success_target, credits_schedule)
       VALUES (:org, :tier, :up, :lat, :succ, :cs::jsonb)
       ON CONFLICT (org_id) DO UPDATE SET tier=EXCLUDED.tier, uptime_target=EXCLUDED.uptime_target, latency_target_ms=EXCLUDED.latency_target_ms, success_target=EXCLUDED.success_target, credits_schedule=EXCLUDED.credits_schedule`,
      { replacements: { org: org(req), tier: b.tier || 'enterprise', up: b.uptimeTarget || 99.9, lat: b.latencyTargetMs || 1000, succ: b.successTarget || 99.0, cs: JSON.stringify(b.creditsSchedule || []) }, type: Q.INSERT });
    sendSuccess(req, res, { ok: true });
  }),

  // ── White-label ──
  getWhiteLabel: wrap(async (req, res) => sendSuccess(req, res, await whiteLabel.getForOrg(org(req)))),
  upsertWhiteLabel: wrap(async (req, res) => sendSuccess(req, res, await whiteLabel.upsert({ orgId: org(req), config: req.body, actorId: actor(req) }))),
  listWhiteLabelDomains: wrap(async (req, res) => sendSuccess(req, res, await whiteLabel.listDomains(org(req)))),
  addWhiteLabelDomain: wrap(async (req, res) => sendSuccess(req, res, await whiteLabel.addDomain({ orgId: org(req), domain: req.body.domain, actorId: actor(req) }), 201)),
  verifyWhiteLabelDomain: wrap(async (req, res) => sendSuccess(req, res, await whiteLabel.verifyDomain({ id: req.params.id, orgId: org(req) }))),

  // ── Public branding resolution (no auth — powers the white-label login page) ──
  resolveBranding: wrap(async (req, res) => sendSuccess(req, res, await whiteLabel.resolveByDomain(req.query.domain))),

  // ── Audit export ──
  exportAudit: wrap(async (req, res) => {
    const out = await auditExport.exportData(org(req), req.params.source, req.query.format || 'json', Number(req.query.days || 30));
    metrics.incAuditExport(req.query.format || 'json');
    res.setHeader('Content-Type', out.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.end(out.body);
  }),
  addAuditSink: wrap(async (req, res) => {
    await db.sequelize.query(
      `INSERT INTO audit_export_destinations (org_id, type, config_enc, sources) VALUES (:org, :type, :cfg, :src::jsonb)`,
      { replacements: { org: org(req), type: req.body.type, cfg: cryptoVault.encrypt(JSON.stringify(req.body.config || {})), src: JSON.stringify(req.body.sources || ['auth', 'admin']) }, type: Q.INSERT });
    sendSuccess(req, res, { ok: true }, 201);
  }),
  pushSiem: wrap(async (req, res) => sendSuccess(req, res, await auditExport.pushToSiem(org(req)))),
};
