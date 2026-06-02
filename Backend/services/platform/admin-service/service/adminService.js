'use strict';
const { v4: uuidv4 }   = require('uuid');
const crypto           = require('crypto');
const { AppError }     = require('../utils/errors');
const redis            = require('../config/redis');
const eventBus         = require('../utils/eventBus');
const logger           = require('../utils/logger');
const config           = require('../config/appConfig');

// ── Reads from the auth schema (read-only) ────────────────────────────────────
// admin-service queries the shared postgres database directly using raw Sequelize

let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

// ── Platform statistics ───────────────────────────────────────────────────────

async function getPlatformStats() {
    const db = getDb();

    const [userCount, orgCount, sessionCount, recentLogins, failedLogins] = await Promise.all([
        db.sequelize.query('SELECT COUNT(*) AS count FROM auth.users', { plain: true }),
        db.sequelize.query('SELECT COUNT(*) AS count FROM auth.organizations', { plain: true }),
        db.sequelize.query(
            "SELECT COUNT(*) AS count FROM auth.sessions WHERE expires_at > NOW() AND revoked_at IS NULL",
            { plain: true }
        ),
        db.sequelize.query(
            "SELECT COUNT(*) AS count FROM auth.audit_logs WHERE action = 'user.login' AND created_at > NOW() - INTERVAL '24 hours'",
            { plain: true }
        ),
        db.sequelize.query(
            "SELECT COUNT(*) AS count FROM auth.audit_logs WHERE action = 'user.login_failed' AND created_at > NOW() - INTERVAL '24 hours'",
            { plain: true }
        ),
    ]);

    // 30-day daily login trend
    const loginTrend = await db.sequelize.query(`
        SELECT
            date_trunc('day', created_at)::date AS date,
            COUNT(*) FILTER (WHERE action = 'user.login')        AS success,
            COUNT(*) FILTER (WHERE action = 'user.login_failed') AS failed
        FROM auth.audit_logs
        WHERE created_at > NOW() - INTERVAL '30 days'
          AND action IN ('user.login', 'user.login_failed')
        GROUP BY 1
        ORDER BY 1
    `, { type: db.Sequelize.QueryTypes.SELECT });

    return {
        users:       { total: parseInt(userCount.count, 10) },
        orgs:        { total: parseInt(orgCount.count, 10) },
        activeSessions: parseInt(sessionCount.count, 10),
        last24h: {
            logins:       parseInt(recentLogins.count, 10),
            failedLogins: parseInt(failedLogins.count, 10),
        },
        loginTrend,
    };
}

// ── User management ───────────────────────────────────────────────────────────

async function listUsers({ page = 1, limit = 50, search, status }) {
    const db     = getDb();
    const offset = (page - 1) * limit;

    const where = ['1=1'];
    const replacements = [];

    if (search) {
        where.push(`(email ILIKE $${replacements.length + 1} OR full_name ILIKE $${replacements.length + 2})`);
        replacements.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
        where.push(`status = $${replacements.length + 1}`);
        replacements.push(status);
    }

    const [users, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT id, email, full_name, avatar_url, status, email_verified_at, mfa_enabled, created_at
             FROM auth.users
             WHERE ${where.join(' AND ')}
             ORDER BY created_at DESC
             LIMIT $${replacements.length + 1} OFFSET $${replacements.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...replacements, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM auth.users WHERE ${where.join(' AND ')}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: replacements }
        ),
    ]);

    return { items: users, total: count, page, limit, hasMore: offset + limit < count };
}

async function getUserDetail(userId) {
    const db = getDb();
    const [user] = await db.sequelize.query(
        `SELECT u.id, u.email, u.full_name, u.avatar_url, u.status, u.email_verified_at,
                u.mfa_enabled, u.created_at,
                json_agg(json_build_object('orgId', m.org_id, 'role', m.role, 'joinedAt', m.joined_at)) AS memberships
         FROM auth.users u
         LEFT JOIN auth.team_members m ON m.user_id = u.id AND m.status = 'active'
         WHERE u.id = $1
         GROUP BY u.id`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    return user;
}

async function suspendUser(userId, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';
    await db.sequelize.query(
        "UPDATE auth.users SET status = 'suspended', updated_at = NOW() WHERE id = $1",
        { bind: [userId] }
    );

    // Revoke all active sessions for this user
    await db.sequelize.query(
        "UPDATE auth.sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        { bind: [userId] }
    );

    // Revoke all refresh tokens
    await db.sequelize.query(
        "UPDATE auth.refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        { bind: [userId] }
    );

    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, metadata, ip_address)
         VALUES ($1, 'user.suspended', $2, $3)`,
        { bind: [userId, JSON.stringify({ suspendedBy: adminUserId }), ip] }
    );

    logger.info({ userId, adminUserId, event: 'admin.user_suspended' }, 'User suspended by admin');
}

async function unsuspendUser(userId, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';
    await db.sequelize.query(
        "UPDATE auth.users SET status = 'active', updated_at = NOW() WHERE id = $1",
        { bind: [userId] }
    );
    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, metadata, ip_address)
         VALUES ($1, 'user.unsuspended', $2, $3)`,
        { bind: [userId, JSON.stringify({ unsuspendedBy: adminUserId }), ip] }
    );
    logger.info({ userId, adminUserId }, 'User unsuspended');
}

// ── Org management ────────────────────────────────────────────────────────────

async function listOrgs({ page = 1, limit = 50, search, plan }) {
    const db     = getDb();
    const offset = (page - 1) * limit;
    const where  = ['1=1'];
    const bind   = [];

    if (search) { where.push(`(o.name ILIKE $${bind.length + 1} OR o.slug ILIKE $${bind.length + 2})`); bind.push(`%${search}%`, `%${search}%`); }
    if (plan)   { where.push(`o.plan = $${bind.length + 1}`); bind.push(plan); }

    const [orgs, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT o.id, o.name, o.slug, o.plan, o.owner_id, o.created_at,
                    COUNT(m.id)::int AS member_count,
                    ou.email AS owner_email, ou.full_name AS owner_name, ou.avatar_url AS owner_avatar
             FROM auth.organizations o
             LEFT JOIN auth.team_members m ON m.org_id = o.id AND m.status = 'active'
             LEFT JOIN auth.users ou ON ou.id = o.owner_id
             WHERE ${where.join(' AND ')}
             GROUP BY o.id, ou.email, ou.full_name, ou.avatar_url
             ORDER BY o.created_at DESC
             LIMIT $${bind.length + 1} OFFSET $${bind.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...bind, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM auth.organizations o WHERE ${where.join(' AND ')}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind }
        ),
    ]);

    return { items: orgs, total: count, page, limit, hasMore: offset + limit < count };
}

// ── Impersonation ─────────────────────────────────────────────────────────────

async function createImpersonationToken(adminUserId, targetUserId, ipAddress) {
    const db = getDb();

    const [targetUser] = await db.sequelize.query(
        `SELECT u.id, u.email, u.full_name, u.status,
                (SELECT m.role FROM auth.team_members m WHERE m.user_id = u.id AND m.status = 'active' ORDER BY m.joined_at ASC LIMIT 1) AS role,
                (SELECT m.org_id FROM auth.team_members m WHERE m.user_id = u.id AND m.status = 'active' ORDER BY m.joined_at ASC LIMIT 1) AS org_id
         FROM auth.users u WHERE u.id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [targetUserId] }
    );

    if (!targetUser) throw new AppError('NOT_FOUND', 'User not found', 404);
    if (targetUser.status !== 'active') throw new AppError('ACCOUNT_DISABLED', 'Cannot impersonate a suspended account', 403);
    if (String(targetUser.id) === String(adminUserId)) throw new AppError('INVALID_REQUEST', 'Cannot impersonate yourself', 400);

    const impersonationId = uuidv4();
    const ip = ipAddress || '0.0.0.0';

    const r = redis.getClient();
    if (r && redis.isAvailable()) {
        await r.set(
            `auth:impersonate:${impersonationId}`,
            JSON.stringify({ adminUserId, targetUserId, createdAt: Date.now() }),
            'EX', config.impersonationTtl,
        );
    }

    // Issue a short-lived access token for the target user, signed via auth-service
    // In production, call auth-service internal API; for now we use the JWT key directly
    const jwt   = require('jsonwebtoken');
    const fs    = require('fs');

    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
    const privateKeyB64  = process.env.JWT_PRIVATE_KEY_B64;
    const privateKeyInline = process.env.JWT_PRIVATE_KEY;

    let privateKey;
    if (privateKeyPath) {
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    } else if (privateKeyB64) {
        privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
    } else if (privateKeyInline) {
        privateKey = privateKeyInline.replace(/\\n/g, '\n');
    } else {
        throw new AppError('CONFIGURATION_ERROR', 'JWT private key not available in admin-service', 500);
    }

    const token = jwt.sign(
        {
            sub:             String(targetUser.id),
            email:           targetUser.email,
            org_id:          targetUser.org_id,
            roles:           [targetUser.role || 'member'],   // canonical roles[]
            role:            targetUser.role || 'member',     // DEPRECATED scalar compat
            permissions:     [],
            sid:             impersonationId,
            impersonation:   true,                  // Phase 9: explicit impersonation marker
            impersonated_by: String(adminUserId),
            jti:             uuidv4(),
        },
        privateKey,
        {
            algorithm:  'RS256',
            expiresIn:  `${config.impersonationTtl}s`,        // <= 15m (security policy)
            issuer:     config.jwt.impersonationIssuer,       // ISOLATED issuer — not the canonical 'baalvion-auth'
            audience:   config.jwt.audience,
        }
    );

    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, metadata, ip_address)
         VALUES ($1, 'admin.impersonation_started', $2, $3)`,
        { bind: [adminUserId, JSON.stringify({ targetUserId, impersonationId }), ip] }
    );

    logger.warn({ adminUserId, targetUserId, impersonationId, event: 'admin.impersonation_issued' }, 'Impersonation token issued');

    eventBus.publish('admin.impersonation_started', {
        adminUserId:      String(adminUserId),
        targetUserId:     String(targetUserId),
        targetEmail:      targetUser.email,
        impersonationId,
        expiresIn:        config.impersonationTtl,
    }).catch(() => {});

    return { token, expiresIn: config.impersonationTtl, impersonationId, targetUser: { id: targetUser.id, email: targetUser.email } };
}

// ── Platform-wide session management ─────────────────────────────────────────

async function listAllSessions({ page = 1, limit = 50, userId, orgId }) {
    const db     = getDb();
    const offset = (page - 1) * limit;
    const where  = ['s.revoked_at IS NULL', 's.expires_at > NOW()'];
    const bind   = [];

    if (userId) { where.push(`s.user_id = $${bind.length + 1}`); bind.push(userId); }
    if (orgId)  { where.push(`s.org_id  = $${bind.length + 1}`); bind.push(orgId); }

    const [sessions, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT s.id, s.user_id, s.org_id, s.ip_address, s.user_agent,
                    s.created_at, s.last_seen_at, s.expires_at,
                    u.email, u.full_name
             FROM auth.sessions s
             JOIN auth.users u ON u.id = s.user_id
             WHERE ${where.join(' AND ')}
             ORDER BY s.last_seen_at DESC
             LIMIT $${bind.length + 1} OFFSET $${bind.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...bind, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM auth.sessions s WHERE ${where.join(' AND ')}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind }
        ),
    ]);

    return { items: sessions, total: count, page, limit, hasMore: offset + limit < count };
}

async function revokeSessionAdmin(sessionId, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';
    const [[session]] = await Promise.all([
        db.sequelize.query(
            'SELECT id, user_id FROM auth.sessions WHERE id = $1',
            { type: db.Sequelize.QueryTypes.SELECT, bind: [sessionId] }
        ),
    ]);
    if (!session) throw new AppError('NOT_FOUND', 'Session not found', 404);

    await db.sequelize.query(
        'UPDATE auth.sessions SET revoked_at = NOW() WHERE id = $1',
        { bind: [sessionId] }
    );
    await db.sequelize.query(
        'UPDATE auth.refresh_tokens SET revoked_at = NOW() WHERE session_id = $1 AND revoked_at IS NULL',
        { bind: [sessionId] }
    );
    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, metadata, ip_address)
         VALUES ($1, 'session.revoked', $2, $3)`,
        { bind: [session.user_id, JSON.stringify({ sessionId, revokedBy: adminUserId, reason: 'admin_revoke' }), ip] }
    );
    logger.info({ sessionId, adminUserId }, 'Session revoked by admin');
}

// ── Audit log query ───────────────────────────────────────────────────────────

async function getAuditLogs({ page = 1, limit = 50, orgId, userId, action, from, to }) {
    const db     = getDb();
    const offset = (page - 1) * limit;
    const where  = ['1=1'];
    const bind   = [];

    if (orgId)  { where.push(`a.org_id  = $${bind.length + 1}`); bind.push(orgId); }
    if (userId) { where.push(`a.user_id = $${bind.length + 1}`); bind.push(userId); }
    if (action) {
        // The console may pass a comma-separated list of actions (e.g. the Security
        // page) — match any of them. A single value falls back to equality.
        const actions = String(action).split(',').map((s) => s.trim()).filter(Boolean);
        if (actions.length > 1) { where.push(`a.action = ANY($${bind.length + 1})`); bind.push(actions); }
        else if (actions.length === 1) { where.push(`a.action = $${bind.length + 1}`); bind.push(actions[0]); }
    }
    if (from) { where.push(`a.created_at >= $${bind.length + 1}`); bind.push(from); }
    if (to)   { where.push(`a.created_at <= $${bind.length + 1}`); bind.push(to); }

    const whereSql = where.join(' AND ');

    // NOTE: auth.audit_logs has no user_agent/severity columns — emit NULLs so the
    // console's AdminAuditLog shape is preserved. Join the actor (user) so the console's
    // "Actor" column can show a real name/email/avatar instead of just a numeric id.
    const [logs, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT a.id, a.user_id, a.org_id, a.action, a.resource_type, a.resource_id,
                    a.metadata, a.ip_address,
                    NULL::text AS user_agent,
                    NULL::text AS severity,
                    a.created_at,
                    u.email AS user_email, u.full_name AS user_name, u.avatar_url AS user_avatar
             FROM auth.audit_logs a
             LEFT JOIN auth.users u ON u.id = a.user_id
             WHERE ${whereSql}
             ORDER BY a.created_at DESC
             LIMIT $${bind.length + 1} OFFSET $${bind.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...bind, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM auth.audit_logs a WHERE ${whereSql}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind }
        ),
    ]);

    return { items: logs, total: count, page, limit, hasMore: offset + limit < count };
}

// ── Risk events (derived from the audit log) ────────────────────────────────────
// admin-service has no dedicated risk engine; the Security console's risk feed is
// synthesized from security-relevant audit actions so it shows real signal.
const RISK_ACTION_MAP = {
    'user.login_failed':                { type: 'brute_force',  severity: 'medium'   },
    'security.refresh_reuse_detected':  { type: 'token_reuse',  severity: 'critical' },
    'admin.impersonation_started':      { type: 'device_new',   severity: 'high'     },
    'session.revoked':                  { type: 'geo_anomaly',  severity: 'low'      },
};

async function listRiskEvents({ page = 1, limit = 20 }) {
    const db     = getDb();
    const offset = (page - 1) * limit;
    const actions = Object.keys(RISK_ACTION_MAP);

    const [rows, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT a.id, a.user_id, a.action, a.ip_address, a.metadata, a.created_at,
                    u.email AS user_email
             FROM auth.audit_logs a
             LEFT JOIN auth.users u ON u.id = a.user_id
             WHERE a.action = ANY($1)
             ORDER BY a.created_at DESC
             LIMIT $2 OFFSET $3`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [actions, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM auth.audit_logs a WHERE a.action = ANY($1)`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [actions] }
        ),
    ]);

    const items = rows.map((r) => {
        const map = RISK_ACTION_MAP[r.action] || { type: 'geo_anomaly', severity: 'low' };
        return {
            id:         String(r.id),
            userId:     r.user_id ? String(r.user_id) : '',
            userEmail:  r.user_email || (r.metadata && r.metadata.email) || 'unknown',
            type:       map.type,
            severity:   map.severity,
            ip:         r.ip_address || '',
            country:    '',
            city:       '',
            details:    r.metadata || {},
            resolvedAt: null,
            createdAt:  r.created_at,
        };
    });

    return { success: true, data: items, pagination: { page, limit, total: count, totalPages: limit ? Math.ceil(count / limit) : 1, hasNext: page * limit < count, hasPrev: page > 1 } };
}

module.exports = {
    getPlatformStats,
    listUsers, getUserDetail, suspendUser, unsuspendUser,
    listOrgs,
    createImpersonationToken,
    listAllSessions, revokeSessionAdmin,
    getAuditLogs,
    listRiskEvents,
};
