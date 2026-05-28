'use strict';

/**
 * Enterprise SSO — SAML 2.0 + OIDC, per-org IdP config (Okta / Entra ID / Google
 * Workspace / OneLogin). Real signature/assertion validation via @node-saml and
 * openid-client (LAZY-required so the app boots without them; install to enable).
 * Supports SP- & IdP-initiated SAML, JIT provisioning, and group→role mapping.
 */

const crypto = require('crypto');
const db = require('../models');
const cryptoVault = require('./cryptoVault');
const sessionStore = require('./sessionStore');
const jwtServer = require('../utils/jwtserver');
const rbac = require('./rbac');
const complianceAudit = require('./complianceAudit');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const BASE = process.env.API_BASE_URL || 'http://localhost:4000';

async function getConnection(orgId) {
  const [c] = await db.sequelize.query(`SELECT * FROM sso_connections WHERE org_id = :org AND enabled = true`, { replacements: { org: orgId }, type: Q.SELECT });
  return c || null;
}

// ── SAML ──────────────────────────────────────────────────────────────────────
function samlInstance(conn) {
  const { SAML } = require('@node-saml/node-saml'); // lazy
  return new SAML({
    callbackUrl: `${BASE}/v1/sso/saml/${conn.org_id}/acs`,
    entryPoint: conn.idp_sso_url,
    issuer: `${BASE}/v1/sso/saml/${conn.org_id}/metadata`,
    idpCert: conn.idp_cert,
    wantAssertionsSigned: true,
    signatureAlgorithm: 'sha256',
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  });
}

async function samlMetadata(orgId) {
  const conn = await getConnection(orgId);
  if (!conn || conn.type !== 'saml') throw new Error('no SAML connection');
  return samlInstance(conn).generateServiceProviderMetadata(null, null);
}

async function samlLoginUrl(orgId, relayState = '') {
  const conn = await getConnection(orgId);
  if (!conn || conn.type !== 'saml') throw new Error('no SAML connection');
  return samlInstance(conn).getAuthorizeUrlAsync(relayState, null, {});
}

async function handleSamlAcs(orgId, body) {
  const conn = await getConnection(orgId);
  if (!conn) throw new Error('no SSO connection');
  const { profile } = await samlInstance(conn).validatePostResponseAsync(body); // verifies signature
  const attrs = conn.attribute_map || {};
  const pick = (k, def) => (attrs[k] && profile[attrs[k]]) || profile[k] || def;
  return jitProvision(conn, {
    email: (profile.nameID || pick('email')),
    firstName: pick('firstName', ''),
    lastName: pick('lastName', ''),
    groups: toArray(profile[attrs.groups || 'groups']),
  });
}

// ── OIDC ────────────────────────────────────────────────────────────────────
async function oidcClient(conn) {
  const { Issuer } = require('openid-client'); // lazy
  const issuer = await Issuer.discover(conn.oidc_issuer);
  return new issuer.Client({
    client_id: conn.oidc_client_id,
    client_secret: cryptoVault.decrypt(conn.oidc_secret_enc),
    redirect_uris: [`${BASE}/v1/sso/oidc/${conn.org_id}/callback`],
    response_types: ['code'],
  });
}

async function oidcAuthUrl(orgId, state) {
  const conn = await getConnection(orgId);
  if (!conn || conn.type !== 'oidc') throw new Error('no OIDC connection');
  const client = await oidcClient(conn);
  return client.authorizationUrl({ scope: 'openid email profile groups', state });
}

async function handleOidcCallback(orgId, params, state) {
  const conn = await getConnection(orgId);
  if (!conn) throw new Error('no SSO connection');
  const client = await oidcClient(conn);
  const tokenSet = await client.callback(`${BASE}/v1/sso/oidc/${orgId}/callback`, params, { state });
  const ui = await client.userinfo(tokenSet);
  return jitProvision(conn, { email: ui.email, firstName: ui.given_name || '', lastName: ui.family_name || '', groups: toArray(ui.groups) });
}

// ── JIT provisioning + group→role mapping ─────────────────────────────────────
function toArray(v) { return Array.isArray(v) ? v : v ? [v] : []; }

function mapRole(conn, groups) {
  const map = conn.group_role_map || {};
  for (const g of groups) if (map[g]) return map[g];
  return conn.default_role || 'viewer';
}

async function jitProvision(conn, { email, firstName, lastName, groups }) {
  if (!email) throw new Error('SSO assertion missing email');
  const role = mapRole(conn, groups);
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];

  let [user] = await db.sequelize.query(`SELECT id, org_id, email, status FROM users WHERE email = :e`, { replacements: { e: email.toLowerCase() }, type: Q.SELECT });
  if (!user) {
    const created = await db.users.create({
      org_id: conn.org_id, email: email.toLowerCase(), full_name: fullName,
      role, status: 'active', password_hash: 'sso:' + crypto.randomBytes(16).toString('hex'),
      provisioned_via: 'sso_jit', active: true,
    });
    user = { id: created.id, org_id: conn.org_id, email: email.toLowerCase(), status: 'active' };
    await db.sequelize.query(
      `INSERT INTO org_memberships (org_id, user_id, role, status) VALUES (:org, :u, :role, 'active') ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      { replacements: { org: conn.org_id, u: user.id, role }, type: Q.INSERT },
    ).catch(() => {});
  } else {
    await db.users.update({ role, full_name: fullName }, { where: { id: user.id } });
  }
  await complianceAudit.log({ domain: 'access', action: 'sso_login', orgId: conn.org_id, actorId: user.id, payload: { role, via: conn.type } });
  return { user, role };
}

/** Mint a Baalvion session for an SSO-authenticated user. */
async function completeLogin({ user, role }, { ipAddress, userAgent } = {}) {
  const session = await sessionStore.createSession({ userId: user.id, orgId: user.org_id, tokenVersion: 0, ipAddress, userAgent });
  const token = jwtServer.generateAccessToken({
    userId: user.id, email: user.email, organizationId: user.org_id, role,
    permissions: rbac.expandPermissions(role), sessionId: session.sessionId, tokenVersion: 0,
  });
  return { token, refreshToken: session.refreshToken, user: { id: user.id, email: user.email, orgId: user.org_id, role } };
}

module.exports = { getConnection, samlMetadata, samlLoginUrl, handleSamlAcs, oidcAuthUrl, handleOidcCallback, jitProvision, mapRole, completeLogin };
