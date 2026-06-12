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

// PATCH safe user fields only. NEVER patchable: password_hash, email, email_verified_at,
// mfa_*, recovery_codes — i.e. no auth/verification bypass via this endpoint. The user's
// org role lives on auth.team_members, not auth.users, so role changes are out of scope
// here (handled by org membership endpoints).
const USER_ALLOWED_STATUS = ['active', 'suspended'];

async function updateUser(userId, patch, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [user] = await db.sequelize.query(
        'SELECT id, status FROM auth.users WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const sets = [];
    const bind = [];
    const changed = {};

    // Accept both camelCase (fullName) and snake_case (full_name) from the console.
    const fullName = patch.fullName !== undefined ? patch.fullName : patch.full_name;
    if (fullName !== undefined) {
        const trimmed = fullName == null ? null : String(fullName).trim();
        if (trimmed != null && trimmed.length > 255) {
            throw new AppError('VALIDATION_ERROR', 'Full name must be at most 255 chars', 400);
        }
        sets.push(`full_name = $${bind.length + 1}`); bind.push(trimmed || null); changed.fullName = trimmed || null;
    }

    const avatarUrl = patch.avatarUrl !== undefined ? patch.avatarUrl : patch.avatar_url;
    if (avatarUrl !== undefined) {
        const trimmed = avatarUrl == null ? null : String(avatarUrl).trim();
        sets.push(`avatar_url = $${bind.length + 1}`); bind.push(trimmed || null); changed.avatarUrl = trimmed || null;
    }

    if (patch.status !== undefined) {
        if (userId === String(adminUserId) && patch.status === 'suspended') {
            throw new AppError('INVALID_REQUEST', 'Cannot suspend yourself', 400);
        }
        const status = String(patch.status).trim();
        if (!USER_ALLOWED_STATUS.includes(status)) {
            throw new AppError('VALIDATION_ERROR', `Invalid status; allowed: ${USER_ALLOWED_STATUS.join(', ')}`, 400);
        }
        sets.push(`status = $${bind.length + 1}`); bind.push(status); changed.status = status;
    }

    if (sets.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'No updatable fields provided (fullName, avatarUrl, status)', 400);
    }

    // If status is being moved to suspended, revoke active sessions/refresh tokens too
    // (mirrors suspendUser side effects).
    const goingSuspended = changed.status === 'suspended' && user.status !== 'suspended';

    sets.push('updated_at = NOW()');
    bind.push(userId);

    const [updated] = await db.sequelize.query(
        `UPDATE auth.users SET ${sets.join(', ')}
         WHERE id = $${bind.length}
         RETURNING id, email, full_name, avatar_url, status, email_verified_at, mfa_enabled, created_at, updated_at`,
        { type: db.Sequelize.QueryTypes.SELECT, bind }
    );

    if (goingSuspended) {
        await db.sequelize.query(
            "UPDATE auth.sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
            { bind: [userId] }
        );
        await db.sequelize.query(
            "UPDATE auth.refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
            { bind: [userId] }
        );
    }

    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, 'user.updated', 'user', $2, $3, $4)`,
        { bind: [userId, String(userId), JSON.stringify({ changed, updatedBy: adminUserId }), ip] }
    );

    logger.info({ userId, adminUserId, event: 'admin.user_updated' }, 'User updated by admin');
    return updated;
}

// SOFT delete: auth.users HAS a status column, so we mark the account 'deleted' rather
// than physically removing the row (which would cascade-destroy sessions, memberships and
// orphan audit history). Also revokes active sessions/refresh tokens.
async function deleteUser(userId, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    if (userId === String(adminUserId)) {
        throw new AppError('INVALID_REQUEST', 'Cannot delete yourself', 400);
    }

    const [user] = await db.sequelize.query(
        'SELECT id, status FROM auth.users WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    // Guard: an org owner cannot be deleted while still owning organizations (FK is
    // NOT NULL on organizations.owner_id; reassign/delete the org first).
    const [{ owned_count }] = await db.sequelize.query(
        'SELECT COUNT(*)::int AS owned_count FROM auth.organizations WHERE owner_id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    if (owned_count > 0) {
        throw new AppError('CONFLICT', `User owns ${owned_count} organization(s); reassign or delete them first`, 409);
    }

    await db.sequelize.query(
        "UPDATE auth.users SET status = 'deleted', updated_at = NOW() WHERE id = $1",
        { bind: [userId] }
    );
    await db.sequelize.query(
        "UPDATE auth.sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        { bind: [userId] }
    );
    await db.sequelize.query(
        "UPDATE auth.refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        { bind: [userId] }
    );

    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, 'user.deleted', 'user', $2, $3, $4)`,
        { bind: [userId, String(userId), JSON.stringify({ softDelete: true, deletedBy: adminUserId }), ip] }
    );

    logger.warn({ userId, adminUserId, event: 'admin.user_deleted' }, 'User soft-deleted by admin');
    return { id: String(userId), deleted: true, soft: true };
}

// Re-issue email verification. auth-service owns the email_verifications table + token
// minting + mailer; admin-service does not. We record an audit entry and return a no-op
// success (the console only needs a non-error acknowledgement). If the user is already
// verified, surface that clearly.
async function sendVerification(userId, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [user] = await db.sequelize.query(
        'SELECT id, email, email_verified_at FROM auth.users WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    if (user.email_verified_at) {
        return { message: 'Email already verified', alreadyVerified: true, queued: false };
    }

    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, 'user.verification_resend_requested', 'user', $2, $3, $4)`,
        { bind: [userId, String(userId), JSON.stringify({ email: user.email, requestedBy: adminUserId, note: 'auth-service owns verification dispatch' }), ip] }
    );

    logger.info({ userId, adminUserId, event: 'admin.user_verification_requested' }, 'Verification resend requested');
    return { message: 'Verification request recorded', queued: false };
}

// Revoke all active sessions + refresh tokens for a user (mirrors revokeSessionAdmin,
// but for every session of one user).
async function revokeUserSessions(userId, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [user] = await db.sequelize.query(
        'SELECT id FROM auth.users WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    // RETURNING id yields one row per revoked session — its length is the exact count.
    const revokedSessions = await db.sequelize.query(
        `UPDATE auth.sessions SET revoked_at = NOW()
         WHERE user_id = $1 AND revoked_at IS NULL
         RETURNING id`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    const revokedCount = Array.isArray(revokedSessions) ? revokedSessions.length : 0;

    await db.sequelize.query(
        "UPDATE auth.refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        { bind: [userId] }
    );

    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, 'user.sessions_revoked', 'user', $2, $3, $4)`,
        { bind: [userId, String(userId), JSON.stringify({ revokedBy: adminUserId, reason: 'admin_revoke_all' }), ip] }
    );

    logger.info({ userId, adminUserId, revokedCount, event: 'admin.user_sessions_revoked' }, 'All user sessions revoked by admin');
    return { message: 'Sessions revoked', revokedCount };
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

// Single-org detail (mirrors the listOrgs projection: owner join + active member count).
async function getOrgById(orgId) {
    const db = getDb();
    const [org] = await db.sequelize.query(
        `SELECT o.id, o.name, o.slug, o.plan, o.owner_id, o.created_at, o.updated_at,
                COUNT(m.id)::int AS member_count,
                ou.email AS owner_email, ou.full_name AS owner_name, ou.avatar_url AS owner_avatar
         FROM auth.organizations o
         LEFT JOIN auth.team_members m ON m.org_id = o.id AND m.status = 'active'
         LEFT JOIN auth.users ou ON ou.id = o.owner_id
         WHERE o.id = $1
         GROUP BY o.id, ou.email, ou.full_name, ou.avatar_url`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [orgId] }
    );
    if (!org) throw new AppError('NOT_FOUND', 'Organization not found', 404);
    return org;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_PLANS = ['free', 'starter', 'pro', 'business', 'enterprise'];

// Normalize/validate a slug. Accepts an explicit slug or derives one from the name.
function normalizeSlug(rawSlug, name) {
    const base = (rawSlug != null && String(rawSlug).trim() !== '')
        ? String(rawSlug)
        : String(name || '');
    const slug = base.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug || slug.length > 100 || !SLUG_RE.test(slug)) {
        throw new AppError('VALIDATION_ERROR', 'Invalid slug: use lowercase letters, numbers and hyphens (max 100 chars)', 400);
    }
    return slug;
}

async function createOrg({ name, slug, plan, ownerId }, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName || trimmedName.length > 255) {
        throw new AppError('VALIDATION_ERROR', 'Organization name is required (max 255 chars)', 400);
    }
    const finalSlug = normalizeSlug(slug, trimmedName);

    let finalPlan = 'free';
    if (plan != null && String(plan).trim() !== '') {
        finalPlan = String(plan).trim();
        if (!ALLOWED_PLANS.includes(finalPlan)) {
            throw new AppError('VALIDATION_ERROR', `Invalid plan; allowed: ${ALLOWED_PLANS.join(', ')}`, 400);
        }
    }

    // owner_id is NOT NULL with an FK to auth.users. Default to the acting admin when
    // the console does not supply one. Validate the referenced user exists (clear error
    // instead of a raw FK violation).
    const ownerCandidate = (ownerId != null && String(ownerId).trim() !== '') ? ownerId : adminUserId;
    const [owner] = await db.sequelize.query(
        'SELECT id FROM auth.users WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [ownerCandidate] }
    );
    if (!owner) throw new AppError('VALIDATION_ERROR', 'Owner user not found', 400);

    // Pre-check slug uniqueness for a friendly error (the UNIQUE constraint is the
    // authoritative guard against races).
    const [existing] = await db.sequelize.query(
        'SELECT id FROM auth.organizations WHERE slug = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [finalSlug] }
    );
    if (existing) throw new AppError('CONFLICT', 'An organization with that slug already exists', 409);

    let created;
    try {
        [created] = await db.sequelize.query(
            `INSERT INTO auth.organizations (name, slug, plan, owner_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, slug, plan, owner_id, created_at, updated_at`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [trimmedName, finalSlug, finalPlan, owner.id] }
        );
    } catch (err) {
        if (err && /unique/i.test(err.message || '')) {
            throw new AppError('CONFLICT', 'An organization with that slug already exists', 409);
        }
        throw err;
    }

    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, org_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, $2, 'org.created', 'organization', $3, $4, $5)`,
        { bind: [adminUserId, created.id, String(created.id), JSON.stringify({ name: trimmedName, slug: finalSlug, plan: finalPlan, ownerId: owner.id }), ip] }
    );

    logger.info({ orgId: created.id, adminUserId, event: 'admin.org_created' }, 'Organization created by admin');
    return created;
}

async function updateOrg(orgId, patch, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [org] = await db.sequelize.query(
        'SELECT id, name, slug, plan FROM auth.organizations WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [orgId] }
    );
    if (!org) throw new AppError('NOT_FOUND', 'Organization not found', 404);

    // Whitelist of patchable columns only — never owner_id / id / timestamps via PATCH.
    const sets = [];
    const bind = [];
    const changed = {};

    if (patch.name !== undefined) {
        const trimmedName = typeof patch.name === 'string' ? patch.name.trim() : '';
        if (!trimmedName || trimmedName.length > 255) {
            throw new AppError('VALIDATION_ERROR', 'Organization name must be 1-255 chars', 400);
        }
        sets.push(`name = $${bind.length + 1}`); bind.push(trimmedName); changed.name = trimmedName;
    }
    if (patch.slug !== undefined) {
        const finalSlug = normalizeSlug(patch.slug, org.name);
        if (finalSlug !== org.slug) {
            const [dupe] = await db.sequelize.query(
                'SELECT id FROM auth.organizations WHERE slug = $1 AND id <> $2',
                { type: db.Sequelize.QueryTypes.SELECT, bind: [finalSlug, orgId] }
            );
            if (dupe) throw new AppError('CONFLICT', 'An organization with that slug already exists', 409);
        }
        sets.push(`slug = $${bind.length + 1}`); bind.push(finalSlug); changed.slug = finalSlug;
    }
    if (patch.plan !== undefined) {
        const finalPlan = String(patch.plan).trim();
        if (!ALLOWED_PLANS.includes(finalPlan)) {
            throw new AppError('VALIDATION_ERROR', `Invalid plan; allowed: ${ALLOWED_PLANS.join(', ')}`, 400);
        }
        sets.push(`plan = $${bind.length + 1}`); bind.push(finalPlan); changed.plan = finalPlan;
    }

    if (sets.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'No updatable fields provided (name, slug, plan)', 400);
    }

    sets.push('updated_at = NOW()');
    bind.push(orgId);

    let updated;
    try {
        [updated] = await db.sequelize.query(
            `UPDATE auth.organizations SET ${sets.join(', ')}
             WHERE id = $${bind.length}
             RETURNING id, name, slug, plan, owner_id, created_at, updated_at`,
            { type: db.Sequelize.QueryTypes.SELECT, bind }
        );
    } catch (err) {
        if (err && /unique/i.test(err.message || '')) {
            throw new AppError('CONFLICT', 'An organization with that slug already exists', 409);
        }
        throw err;
    }

    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, org_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, $2, 'org.updated', 'organization', $3, $4, $5)`,
        { bind: [adminUserId, orgId, String(orgId), JSON.stringify({ changed }), ip] }
    );

    logger.info({ orgId, adminUserId, event: 'admin.org_updated' }, 'Organization updated by admin');
    return updated;
}

// HARD delete only. auth.organizations has NO status column (see migration 001), so a
// status-based soft delete is impossible without an auth-schema migration — out of scope
// for admin-service. Deleting an org CASCADES to team_members/sessions/refresh_tokens/
// invitations (and SET NULL on audit_logs.org_id), so it is gated behind an explicit
// confirm flag to prevent accidental destructive calls.
async function deleteOrg(orgId, { confirm } = {}, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [org] = await db.sequelize.query(
        'SELECT id, name, slug, plan, owner_id FROM auth.organizations WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [orgId] }
    );
    if (!org) throw new AppError('NOT_FOUND', 'Organization not found', 404);

    if (confirm !== true) {
        throw new AppError(
            'CONFIRMATION_REQUIRED',
            'Deleting an organization permanently removes its members, sessions and invitations. Re-send with confirm=true to proceed.',
            409,
            { cascades: ['team_members', 'sessions', 'refresh_tokens', 'invitations'] }
        );
    }

    const [{ member_count }] = await db.sequelize.query(
        "SELECT COUNT(*)::int AS member_count FROM auth.team_members WHERE org_id = $1 AND status = 'active'",
        { type: db.Sequelize.QueryTypes.SELECT, bind: [orgId] }
    );

    // Audit BEFORE the delete (audit_logs.org_id is ON DELETE SET NULL, so the org_id
    // reference would be nulled afterwards anyway — capture the id in metadata too).
    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, org_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, $2, 'org.deleted', 'organization', $3, $4, $5)`,
        { bind: [adminUserId, orgId, String(orgId), JSON.stringify({ orgId, name: org.name, slug: org.slug, plan: org.plan, memberCount: member_count, deletedBy: adminUserId }), ip] }
    );

    await db.sequelize.query(
        'DELETE FROM auth.organizations WHERE id = $1',
        { bind: [orgId] }
    );

    logger.warn({ orgId, adminUserId, memberCount: member_count, event: 'admin.org_deleted' }, 'Organization hard-deleted by admin');
    return { id: String(orgId), deleted: true };
}

// Suspend an organization. auth.organizations has NO status column, so there is no
// schema-supported way to mark an org suspended from admin-service alone. Rather than
// silently lying or crashing, fail with a clear, structured error so the console can
// surface it. (Wiring real org suspension requires an auth-schema status column.)
async function suspendOrg(orgId, reason, adminUserId, ipAddress) {
    const db = getDb();
    const ip = ipAddress || '0.0.0.0';

    const [org] = await db.sequelize.query(
        'SELECT id FROM auth.organizations WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [orgId] }
    );
    if (!org) throw new AppError('NOT_FOUND', 'Organization not found', 404);

    // Record the intent for auditability even though state cannot be changed here.
    await db.sequelize.query(
        `INSERT INTO auth.audit_logs (user_id, org_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, $2, 'org.suspend_requested', 'organization', $3, $4, $5)`,
        { bind: [adminUserId, orgId, String(orgId), JSON.stringify({ reason: reason || null, note: 'no auth.organizations.status column' }), ip] }
    );

    logger.warn({ orgId, adminUserId, event: 'admin.org_suspend_unsupported' }, 'Org suspend requested but auth schema has no status column');
    throw new AppError(
        'NOT_IMPLEMENTED',
        'Organization suspension is not supported: the auth schema has no organization status column.',
        501
    );
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
    updateUser, deleteUser, sendVerification, revokeUserSessions,
    listOrgs, getOrgById, createOrg, updateOrg, deleteOrg, suspendOrg,
    createImpersonationToken,
    listAllSessions, revokeSessionAdmin,
    getAuditLogs,
    listRiskEvents,
};
