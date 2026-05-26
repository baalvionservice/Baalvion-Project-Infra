'use strict';

/**
 * API key lifecycle (enterprise-grade).
 *
 * Key format:   <prefix><secret>
 *   bvl_live_<secret>    live REST/SDK key
 *   bvl_test_<secret>    test/sandbox key
 *   bvl_proxy_<secret>   proxy-gateway credential (password in Proxy-Authorization)
 *   bns_<secret>         LEGACY (Prompt 1) — still verifiable for backward compat
 *
 * Only the SHA-256 hash of the full key is stored. The plaintext is shown to the
 * caller exactly once at creation/rotation. Scopes live in api_key_scopes.
 */

const db = require('../models');
const { sha256, randomKey, timingSafeEqualHex } = require('../utils/crypto');
const { scopesToPermissions } = require('./rbac');
const logger = require('./logger');

const PREFIXES = {
  'api:live': 'bvl_live_',
  'api:test': 'bvl_test_',
  'proxy:live': 'bvl_proxy_',
  'proxy:test': 'bvl_proxy_',
};
const KNOWN_PREFIXES = ['bvl_live_', 'bvl_test_', 'bvl_proxy_', 'bns_'];

const DEFAULT_SCOPES = {
  api: ['usage:read', 'analytics:read'],
  proxy: ['proxy:connect', 'proxy:sticky', 'usage:read'],
};

function prefixFor(keyType, environment) {
  return PREFIXES[`${keyType}:${environment}`] || PREFIXES['api:live'];
}

function detectPrefix(rawKey) {
  return KNOWN_PREFIXES.find((p) => rawKey.startsWith(p)) || null;
}

/** Create a key. Returns { apiKey, rawKey } — rawKey is shown ONCE. */
async function createKey({ orgId, name, createdBy, scopes, keyType = 'api', environment = 'live', expiresAt = null, metadata = null }) {
  const prefix = prefixFor(keyType, environment);
  const rawKey = prefix + randomKey(24);
  const publicPrefix = rawKey.slice(0, prefix.length + 8); // safe to display/store
  const granted = Array.isArray(scopes) && scopes.length ? scopes : DEFAULT_SCOPES[keyType] || DEFAULT_SCOPES.api;

  const row = await db.api_keys.create({
    org_id: orgId,
    name: name || `${keyType} key`,
    status: 'active',
    environment,
    key_type: keyType,
    key_prefix: publicPrefix,
    key_hash: sha256(rawKey),
    expires_at: expiresAt,
    metadata: metadata || {},
    created_by: createdBy != null && /^\d+$/.test(String(createdBy)) ? Number(createdBy) : null,
  });

  await db.api_key_scopes.bulkCreate(
    granted.map((scope) => ({ api_key_id: row.id, scope })),
    { ignoreDuplicates: true },
  );

  return {
    apiKey: {
      id: row.id, orgId, name: row.name, keyType, environment,
      keyPrefix: publicPrefix, scopes: granted,
      expiresAt, createdAt: row.created_at,
    },
    rawKey,
  };
}

/**
 * Verify a presented key. Returns a sanitized context or null.
 * @returns {{apiKeyId,organizationId,keyType,environment,scopes,permissions}|null}
 */
async function verifyKey(rawKey, { ip } = {}) {
  if (!rawKey || !detectPrefix(rawKey)) return null;

  const presentedHash = sha256(rawKey);
  const key = await db.api_keys.findOne({ where: { key_hash: presentedHash } });
  if (!key) return null;

  // Constant-time confirmation (belt-and-suspenders over the indexed equality lookup).
  if (!timingSafeEqualHex(presentedHash, key.key_hash)) return null;
  if (key.revoked_at) return null;
  if (key.status && key.status !== 'active') return null;
  if (key.expires_at && new Date(key.expires_at).getTime() < Date.now()) return null;

  const scopeRows = await db.api_key_scopes.findAll({ where: { api_key_id: key.id } });
  const scopes = scopeRows.map((r) => r.scope);

  touchLastUsed(key.id, ip);

  return {
    apiKeyId: key.id,
    organizationId: key.org_id,
    keyType: key.key_type || 'api',
    environment: key.environment || 'live',
    scopes,
    permissions: scopesToPermissions(scopes),
  };
}

function touchLastUsed(keyId, ip) {
  db.api_keys.update(
    { last_used_at: new Date(), last_used_ip: ip || null },
    { where: { id: keyId } },
  ).catch((err) => logger.error('[apiKey] last_used update failed:', err.message));
}

/** Rotate a key in place — old secret is immediately invalidated. */
async function rotateKey(keyId, orgId) {
  const key = await db.api_keys.findOne({ where: { id: keyId, org_id: orgId } });
  if (!key) return null;
  const prefix = prefixFor(key.key_type || 'api', key.environment || 'live');
  const rawKey = prefix + randomKey(24);
  await key.update({
    key_hash: sha256(rawKey),
    key_prefix: rawKey.slice(0, prefix.length + 8),
    rotated_at: new Date(),
  });
  return { apiKeyId: key.id, keyPrefix: key.key_prefix, rawKey };
}

async function revokeKey(keyId, orgId) {
  const [count] = await db.api_keys.update(
    { revoked_at: new Date(), status: 'revoked' },
    { where: { id: keyId, org_id: orgId, revoked_at: null } },
  );
  return count > 0;
}

module.exports = {
  createKey,
  verifyKey,
  rotateKey,
  revokeKey,
  touchLastUsed,
  KNOWN_PREFIXES,
  detectPrefix,
};
