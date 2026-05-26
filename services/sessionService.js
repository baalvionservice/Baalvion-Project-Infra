'use strict';
/**
 * Refresh-token session service — OWASP refresh-token rotation with automatic
 * reuse detection.
 *
 *  - A refresh token is an opaque string "<rowId>.<secret>". Only sha256(secret)
 *    is persisted, so a database read cannot reconstruct a usable token.
 *  - Every /auth/refresh issues a NEW token in the same family and revokes the
 *    presented one (rotated_to = successor). Tokens are single-use.
 *  - If a token that was already rotated/revoked is presented again, that is a
 *    replay of a stolen token: the ENTIRE family is revoked (breach response).
 */
const crypto = require('crypto');
const db = require('../models');
const { AppError } = require('../utils/errors');

const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS || 30);
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

const buildToken = (id, secret) => `${id}.${secret}`;

function parseToken(token) {
    const raw = String(token || '');
    const idx = raw.indexOf('.');
    if (idx <= 0 || idx === raw.length - 1) return null;
    return { id: raw.slice(0, idx), secret: raw.slice(idx + 1) };
}

// Constant-time comparison of two hex digests (avoids timing side-channels).
function hexEqual(a, b) {
    const ba = Buffer.from(String(a), 'hex');
    const bb = Buffer.from(String(b), 'hex');
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

// Issue a brand-new session (login/register). Generates a fresh family.
async function issueSession({ userId, tenantId = 'T-DEMO', userAgent = '', ip = '' }) {
    return createInFamily({ userId, tenantId, familyId: crypto.randomUUID(), userAgent, ip });
}

async function createInFamily({ userId, tenantId, familyId, userAgent, ip, transaction = null }) {
    const secret = crypto.randomBytes(32).toString('hex');
    const row = await db.RefreshToken.create({
        user_id: userId,
        tenant_id: tenantId || 'T-DEMO',
        family_id: familyId,
        token_hash: sha256(secret),
        user_agent: String(userAgent || '').slice(0, 512),
        ip: String(ip || '').slice(0, 64),
        expires_at: new Date(Date.now() + REFRESH_TTL_MS),
        last_used_at: new Date(),
    }, transaction ? { transaction } : {});
    return { token: buildToken(row.id, secret), row };
}

/**
 * Rotate a presented refresh token. Returns one of:
 *   { token, row, userId, tenantId }        — success (new token issued)
 *   { reuseDetected: true, familyId, userId } — replay of a spent token (family revoked)
 * Throws AppError(401) for unknown/invalid/expired tokens.
 */
async function rotateSession({ token, userAgent = '', ip = '' }) {
    const parsed = parseToken(token);
    if (!parsed) throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);

    const t = await db.sequelize.transaction();
    try {
        const row = await db.RefreshToken.findByPk(parsed.id, { transaction: t });
        if (!row || !hexEqual(row.token_hash, sha256(parsed.secret))) {
            await t.rollback();
            throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
        }

        // Reuse detection: a token already spent (rotated) or revoked is being
        // replayed → treat as theft and revoke the whole family.
        if (row.revoked_at || row.rotated_to) {
            await db.RefreshToken.update(
                { revoked_at: new Date() },
                { where: { family_id: row.family_id, revoked_at: null }, transaction: t },
            );
            await t.commit();
            return { reuseDetected: true, familyId: row.family_id, userId: row.user_id };
        }

        if (new Date(row.expires_at).getTime() < Date.now()) {
            await row.update({ revoked_at: new Date() }, { transaction: t });
            await t.commit();
            throw new AppError('UNAUTHORIZED', 'Refresh token expired', 401);
        }

        const successor = await createInFamily({
            userId: row.user_id,
            tenantId: row.tenant_id,
            familyId: row.family_id,
            userAgent,
            ip,
            transaction: t,
        });
        await row.update(
            { revoked_at: new Date(), rotated_to: successor.row.id, last_used_at: new Date() },
            { transaction: t },
        );
        await t.commit();
        return { token: successor.token, row: successor.row, userId: row.user_id, tenantId: row.tenant_id };
    } catch (err) {
        if (!t.finished) await t.rollback();
        throw err;
    }
}

// Logout: revoke the session identified by a presented token (best-effort).
async function revokeByToken(token) {
    const parsed = parseToken(token);
    if (!parsed) return false;
    const row = await db.RefreshToken.findByPk(parsed.id);
    if (!row || !hexEqual(row.token_hash, sha256(parsed.secret))) return false;
    if (!row.revoked_at) await row.update({ revoked_at: new Date() });
    return true;
}

// Revoke a specific session by id, scoped to its owner.
async function revokeById(sessionId, userId) {
    const [count] = await db.RefreshToken.update(
        { revoked_at: new Date() },
        { where: { id: sessionId, user_id: userId, revoked_at: null } },
    );
    return count > 0;
}

// Revoke every active session for a user (e.g. "sign out everywhere").
async function revokeAllForUser(userId) {
    const [count] = await db.RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: userId, revoked_at: null } },
    );
    return count;
}

// Active sessions (non-revoked, non-expired) for the device/session list UI.
async function listActive(userId) {
    const rows = await db.RefreshToken.findAll({
        where: { user_id: userId, revoked_at: null },
        order: [['last_used_at', 'DESC']],
    });
    const now = Date.now();
    return rows.filter((r) => new Date(r.expires_at).getTime() > now);
}

module.exports = {
    issueSession,
    rotateSession,
    revokeByToken,
    revokeById,
    revokeAllForUser,
    listActive,
    REFRESH_TTL_DAYS,
    REFRESH_TTL_MS,
};
