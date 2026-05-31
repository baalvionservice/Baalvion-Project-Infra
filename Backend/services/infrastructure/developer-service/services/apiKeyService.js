'use strict';

/**
 * API key lifecycle. A key is shown in full exactly once (at issue/rotate); only
 * its SHA-256 hash + a public prefix/last4 are stored. verify() is the gateway's
 * hot-path check: prefix lookup → constant-time hash compare → scope/expiry gate.
 */

const db = require('../models');
const config = require('../config/appConfig');
const { randomToken, sha256, timingSafeEqualHex } = require('./signing');
const { Errors } = require('../utils/errors');

const PREFIX_LOOKUP_LEN = 14; // envPrefix(8) + 6 chars

function envPrefix(mode) { return mode === 'test' ? config.apiKeys.testPrefix : config.apiKeys.livePrefix; }

function publicView(row) {
    const j = row.toJSON ? row.toJSON() : row;
    delete j.key_hash;
    return j;
}

async function issue({ orgId, name, mode = 'live', scopes = [], expiresAt = null, rateLimitPerMin, actorId }) {
    const token = `${envPrefix(mode)}${randomToken(config.apiKeys.secretBytes)}`;
    const row = await db.ApiKey.create({
        org_id: orgId ?? null, name, mode: mode === 'test' ? 'test' : 'live',
        key_prefix: token.slice(0, PREFIX_LOOKUP_LEN), key_hash: sha256(token), last4: token.slice(-4),
        scopes: Array.isArray(scopes) ? scopes : [], expires_at: expiresAt,
        rate_limit_per_min: rateLimitPerMin ?? 600, created_by: actorId ?? null,
    });
    return { ...publicView(row), key: token }; // plaintext returned once
}

async function list(orgScope, { mode, status, limit = 100, offset = 0 } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (mode) where.mode = mode;
    if (status) where.status = status;
    const { rows, count } = await db.ApiKey.findAndCountAll({
        where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 100, 200), offset: Number(offset) || 0,
    });
    return { items: rows.map(publicView), total: count };
}

async function get(id, orgScope) {
    const row = await db.ApiKey.findByPk(id);
    if (!row) throw Errors.notFound('API key not found');
    if (orgScope && row.org_id && row.org_id !== orgScope) throw Errors.forbidden('Key belongs to another organization');
    return row;
}

async function rotate(id, orgScope, actorId) {
    const row = await get(id, orgScope);
    if (row.status !== 'active') throw Errors.badRequest('Cannot rotate a revoked key');
    const token = `${envPrefix(row.mode)}${randomToken(config.apiKeys.secretBytes)}`;
    await row.update({ key_prefix: token.slice(0, PREFIX_LOOKUP_LEN), key_hash: sha256(token), last4: token.slice(-4), rotated_at: new Date() });
    return { ...publicView(row), key: token };
}

async function revoke(id, orgScope) {
    const row = await get(id, orgScope);
    await row.update({ status: 'revoked', revoked_at: new Date() });
    return publicView(row);
}

async function updateScopes(id, scopes, orgScope) {
    const row = await get(id, orgScope);
    await row.update({ scopes: Array.isArray(scopes) ? scopes : [] });
    return publicView(row);
}

/** Gateway hot path: resolve a presented key → org/scopes/mode, or reason for denial. */
async function verify(token, { ip } = {}) {
    if (!token || typeof token !== 'string' || token.length < PREFIX_LOOKUP_LEN) return { valid: false, reason: 'malformed' };
    const candidates = await db.ApiKey.findAll({ where: { key_prefix: token.slice(0, PREFIX_LOOKUP_LEN) } });
    const wantHash = sha256(token);
    const match = candidates.find((c) => timingSafeEqualHex(c.key_hash, wantHash));
    if (!match) return { valid: false, reason: 'not_found' };
    if (match.status !== 'active') return { valid: false, reason: 'revoked' };
    if (match.expires_at && new Date(match.expires_at) < new Date()) return { valid: false, reason: 'expired' };
    // best-effort last-used (don't block the hot path on it)
    match.update({ last_used_at: new Date(), last_used_ip: ip || null }).catch(() => {});
    return {
        valid: true, keyId: match.id, orgId: match.org_id, mode: match.mode,
        scopes: match.scopes || [], rateLimitPerMin: match.rate_limit_per_min,
    };
}

module.exports = { issue, list, get, rotate, revoke, updateScopes, verify, publicView };
