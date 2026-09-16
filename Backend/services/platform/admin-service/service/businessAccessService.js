'use strict';
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

/**
 * Per-business access — the non-CMS half of "one admin panel".
 *
 * Site access lives in cms.cms_website_members and is granted from the console. Everything
 * else (trade, jobs, IR, …) had no equivalent: each app carried its own role list, so one
 * person working across two products meant two grants, two audit trails, and two places to
 * forget them when they leave.
 *
 * These grants are written here and read by auth-service when it mints a token, so a grant
 * made once is honoured by every app, and revoking here revokes everywhere on the next token.
 *
 * Businesses are open-ended on purpose: adding one is a row, not a deploy. The list below is
 * only what the console offers in its picker.
 */
const KNOWN_BUSINESSES = ['trade', 'jobs', 'ir', 'ctm', 'mining', 'marketplace', 'law', 'brand'];

/** Each product keeps its OWN role vocabulary — forcing one across three domains fits none. */
const BUSINESS_ROLES = {
    trade:       ['viewer', 'ops', 'compliance', 'finance', 'admin'],
    jobs:        ['viewer', 'interviewer', 'recruiter', 'finance', 'admin'],
    ir:          ['viewer', 'analyst', 'editor', 'admin'],
    ctm:         ['viewer', 'reviewer', 'admin'],
    mining:      ['viewer', 'ops', 'admin'],
    marketplace: ['viewer', 'analyst', 'admin'],
    law:         ['viewer', 'editor', 'admin'],
    brand:       ['viewer', 'editor', 'admin'],
};

const MAX_EXPIRY_MS = 2 * 365 * 24 * 60 * 60 * 1000;

function assertValidGrant({ business, role, expiresAt }) {
    if (!KNOWN_BUSINESSES.includes(business)) {
        throw new AppError('VALIDATION', `Unknown business: ${business}`, 422);
    }
    if (!(BUSINESS_ROLES[business] || []).includes(role)) {
        throw new AppError('VALIDATION', `Role '${role}' is not valid for ${business}`, 422);
    }
    if (expiresAt != null) {
        const t = Date.parse(expiresAt);
        if (Number.isNaN(t)) throw new AppError('VALIDATION', 'expiresAt must be a date', 422);
        // Past dates create access that is already dead — a silent failure dressed as success.
        if (t <= Date.now()) throw new AppError('VALIDATION', 'expiresAt must be in the future', 422);
        if (t > Date.now() + MAX_EXPIRY_MS) {
            throw new AppError('VALIDATION', 'expiresAt must be within two years', 422);
        }
    }
}

/** Live grants for one person, newest first. */
async function listForUser(userId) {
    const db = getDb();
    return db.sequelize.query(
        `SELECT id, business, role, granted_by AS "grantedBy", granted_at AS "grantedAt",
                expires_at AS "expiresAt"
           FROM auth.business_grants
          WHERE user_id = $1 AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY business`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] },
    );
}

/** Live grants across everyone — powers the console's People view in one query. */
async function listAll() {
    const db = getDb();
    return db.sequelize.query(
        `SELECT g.id, g.user_id AS "userId", g.business, g.role,
                g.granted_at AS "grantedAt", g.expires_at AS "expiresAt",
                u.email, u.full_name AS "fullName"
           FROM auth.business_grants g
           JOIN auth.users u ON u.id = g.user_id
          WHERE g.revoked_at IS NULL
            AND (g.expires_at IS NULL OR g.expires_at > NOW())
          ORDER BY g.business, u.email`,
        { type: db.Sequelize.QueryTypes.SELECT },
    );
}

/**
 * Grant one person access to one or more businesses.
 *
 * Re-granting an existing business UPDATES it (role or expiry) rather than erroring, so the
 * console can be used to change someone's role without a revoke-then-grant dance that would
 * leave a gap in their access and two confusing audit entries.
 */
async function grant({ userId, businesses, role, expiresAt = null, actorId, ipAddress }) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [user] = await db.sequelize.query(
        'SELECT id, email FROM auth.users WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] },
    );
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    for (const business of businesses) assertValidGrant({ business, role, expiresAt });

    const granted = [];
    for (const business of businesses) {
        const [row] = await db.sequelize.query(
            `INSERT INTO auth.business_grants (user_id, business, role, granted_by, expires_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, business) WHERE revoked_at IS NULL
             DO UPDATE SET role = EXCLUDED.role, expires_at = EXCLUDED.expires_at,
                           granted_by = EXCLUDED.granted_by, updated_at = NOW()
             RETURNING id, business, role, expires_at AS "expiresAt"`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [userId, business, role, actorId ?? null, expiresAt] },
        );
        granted.push(row);

        await db.sequelize.query(
            `INSERT INTO auth.audit_logs (user_id, action, metadata, ip_address)
             VALUES ($1, 'business.access_granted', $2, $3)`,
            { bind: [userId, JSON.stringify({ business, role, expiresAt, grantedBy: actorId, email: user.email }), ip] },
        );
    }

    logger.info({ userId, businesses, role, actorId, event: 'admin.business_access_granted' }, 'Business access granted');
    return { granted };
}

/**
 * Revoke access — one business, or every business at once.
 *
 * Rows are marked revoked rather than deleted: "who had access to trade in March" is a
 * question a deleted row cannot answer. Each business is audited separately so the trail
 * names exactly what was taken away.
 */
async function revoke({ userId, business = null, actorId, ipAddress }) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const rows = await db.sequelize.query(
        `UPDATE auth.business_grants
            SET revoked_at = NOW(), updated_at = NOW()
          WHERE user_id = $1 AND revoked_at IS NULL
            ${business ? 'AND business = $2' : ''}
        RETURNING id, business, role`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: business ? [userId, business] : [userId] },
    );

    for (const r of rows) {
        await db.sequelize.query(
            `INSERT INTO auth.audit_logs (user_id, action, metadata, ip_address)
             VALUES ($1, 'business.access_revoked', $2, $3)`,
            { bind: [userId, JSON.stringify({ business: r.business, role: r.role, revokedBy: actorId }), ip] },
        );
    }

    logger.info({ userId, business: business || 'ALL', revoked: rows.length, actorId, event: 'admin.business_access_revoked' }, 'Business access revoked');
    return { revoked: rows };
}

module.exports = { KNOWN_BUSINESSES, BUSINESS_ROLES, assertValidGrant, listForUser, listAll, grant, revoke };
