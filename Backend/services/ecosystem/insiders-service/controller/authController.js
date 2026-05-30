'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const config = require('../config/appConfig');
const { signAccessToken } = require('../utils/jwtserver');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const REFRESH_TTL_MS = () => config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000;

async function rolesFor(userId) {
    const rows = await db.UserRole.findAll({ where: { user_id: userId }, attributes: ['role'] });
    return rows.map((r) => r.role);
}

async function shapeUser(user, profile, roles) {
    return {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        created_at: user.created_at,
        roles,
        user_metadata: {
            username: profile?.username || null,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
        },
    };
}

// Issue an access token + opaque rotating refresh token (sha256-stored).
async function issueSession(req, res, user) {
    const roles = await rolesFor(user.id);
    const profile = await db.Profile.findByPk(user.id);
    const rawRefresh = `${uuidv4()}.${uuidv4()}`;
    await db.RefreshToken.create({
        user_id: user.id,
        token_hash: sha256(rawRefresh),
        user_agent: req.headers['user-agent'] || null,
        ip: req.ip,
        expires_at: new Date(Date.now() + REFRESH_TTL_MS()),
    });
    const accessToken = signAccessToken({ id: user.id, email: user.email, roles });
    return {
        access_token: accessToken,
        refresh_token: rawRefresh,
        token_type: 'bearer',
        expires_in: 86400,
        user: await shapeUser(user, profile, roles),
    };
}

const register = async (req, res, next) => {
    const t = await db.sequelize.transaction();
    try {
        const { email, password, username, full_name } = req.body || {};
        if (!email || !password) throw new AppError('BAD_REQUEST', 'email and password are required', 400);
        if (String(password).length < 8) throw new AppError('BAD_REQUEST', 'password must be at least 8 characters', 400);
        const normEmail = String(email).trim().toLowerCase();
        const uname = (username || normEmail.split('@')[0]).trim();

        if (await db.User.findOne({ where: { email: normEmail }, transaction: t })) {
            throw new AppError('CONFLICT', 'Email already registered', 409);
        }
        if (await db.Profile.findOne({ where: { username: uname }, transaction: t })) {
            throw new AppError('CONFLICT', 'Username already taken', 409);
        }

        const user = await db.User.create({
            email: normEmail,
            password_hash: await bcrypt.hash(password, 10),
            email_verified: true, // dev: no email infra; auto-verify so login works
            verify_token: sha256(uuidv4()),
        }, { transaction: t });
        await db.Profile.create({ id: user.id, username: uname, full_name: full_name || null }, { transaction: t });
        await db.UserRole.create({ user_id: user.id, role: 'user' }, { transaction: t });
        await t.commit();

        const session = await issueSession(req, res, user);
        return sendSuccess(req, res, { user: session.user, session }, 201);
    } catch (err) {
        await t.rollback().catch(() => {});
        return next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) throw new AppError('BAD_REQUEST', 'email and password are required', 400);
        const user = await db.User.findOne({ where: { email: String(email).trim().toLowerCase() } });
        if (!user) throw new AppError('UNAUTHORIZED', 'Invalid login credentials', 401);

        if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
            const retryAfterSeconds = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000);
            throw new AppError('ACCOUNT_LOCKED', 'Account temporarily locked due to failed logins', 423, { retryAfterSeconds });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            const attempts = (user.failed_login_attempts || 0) + 1;
            if (attempts >= config.security.loginMaxAttempts) {
                await user.update({ failed_login_attempts: 0, locked_until: new Date(Date.now() + config.security.loginLockoutMinutes * 60000) });
            } else {
                await user.update({ failed_login_attempts: attempts });
            }
            throw new AppError('UNAUTHORIZED', 'Invalid login credentials', 401);
        }
        if (!user.is_active) throw new AppError('FORBIDDEN', 'Account is deactivated', 403);

        await user.update({ failed_login_attempts: 0, locked_until: null, last_login_at: new Date() });
        const session = await issueSession(req, res, user);
        return sendSuccess(req, res, { user: session.user, session });
    } catch (err) { return next(err); }
};

const me = async (req, res, next) => {
    try {
        const user = await db.User.findByPk(req.auth.userId, { attributes: { exclude: ['password_hash', 'verify_token', 'reset_token'] } });
        if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
        const profile = await db.Profile.findByPk(user.id);
        const roles = await rolesFor(user.id);
        return sendSuccess(req, res, { user: await shapeUser(user, profile, roles) });
    } catch (err) { return next(err); }
};

// Canonical identity probe for gateway-authenticated callers. Returns the LOCAL users.id
// (uuid the island keys all ownership by — see middleware/gatewayIdentity.js), the central
// gateway id, merged roles, and the shaped profile. The frontend uses `userId` as its
// `user.id` so client-side ownership filters (.eq('id', user.id)) line up with the backend.
const whoami = async (req, res, next) => {
    try {
        const user = await db.User.findByPk(req.auth.userId, { attributes: { exclude: ['password_hash', 'verify_token', 'reset_token'] } });
        const profile = await db.Profile.findByPk(req.auth.userId);
        const roles = req.auth.roles || [];
        return sendSuccess(req, res, {
            userId: req.auth.userId,
            gatewayUserId: req.auth.gatewayUserId || null,
            email: user ? user.email : null,
            roles,
            user: user ? await shapeUser(user, profile, roles) : null,
        });
    } catch (err) { return next(err); }
};

const refresh = async (req, res, next) => {
    try {
        const raw = req.body?.refresh_token;
        if (!raw) throw new AppError('UNAUTHORIZED', 'No refresh token provided', 401);
        const row = await db.RefreshToken.findOne({ where: { token_hash: sha256(raw) } });
        if (!row || row.revoked_at || new Date(row.expires_at).getTime() < Date.now()) {
            throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
        }
        const user = await db.User.findByPk(row.user_id);
        if (!user || !user.is_active) throw new AppError('UNAUTHORIZED', 'Account unavailable', 401);
        await row.update({ revoked_at: new Date() }); // rotate: single-use
        const session = await issueSession(req, res, user);
        return sendSuccess(req, res, { user: session.user, session });
    } catch (err) { return next(err); }
};

const logout = async (req, res, next) => {
    try {
        const raw = req.body?.refresh_token;
        if (raw) await db.RefreshToken.update({ revoked_at: new Date() }, { where: { token_hash: sha256(raw) } });
        return sendSuccess(req, res, { signed_out: true });
    } catch (err) { return next(err); }
};

// Generates a reset token. With no email infra wired, the token is returned in
// the response (dev) so the reset flow is testable end-to-end.
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body || {};
        const user = email && await db.User.findOne({ where: { email: String(email).trim().toLowerCase() } });
        if (user) {
            const token = `${uuidv4()}${uuidv4()}`.replace(/-/g, '');
            await user.update({ reset_token: sha256(token), reset_token_expires: new Date(Date.now() + 3600_000) });
            const devToken = config.env === 'production' ? undefined : token;
            return sendSuccess(req, res, { sent: true, reset_token: devToken });
        }
        // Do not reveal whether the email exists.
        return sendSuccess(req, res, { sent: true });
    } catch (err) { return next(err); }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body || {};
        if (!token || !password) throw new AppError('BAD_REQUEST', 'token and password are required', 400);
        if (String(password).length < 8) throw new AppError('BAD_REQUEST', 'password must be at least 8 characters', 400);
        const user = await db.User.findOne({ where: { reset_token: sha256(token) } });
        if (!user || !user.reset_token_expires || new Date(user.reset_token_expires).getTime() < Date.now()) {
            throw new AppError('UNAUTHORIZED', 'Invalid or expired reset token', 401);
        }
        await user.update({ password_hash: await bcrypt.hash(password, 10), reset_token: null, reset_token_expires: null });
        return sendSuccess(req, res, { updated: true });
    } catch (err) { return next(err); }
};

const updatePassword = async (req, res, next) => {
    try {
        const { password } = req.body || {};
        if (!password || String(password).length < 8) throw new AppError('BAD_REQUEST', 'password must be at least 8 characters', 400);
        const user = await db.User.findByPk(req.auth.userId);
        if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
        await user.update({ password_hash: await bcrypt.hash(password, 10) });
        return sendSuccess(req, res, { updated: true });
    } catch (err) { return next(err); }
};

module.exports = { register, login, me, whoami, refresh, logout, forgotPassword, resetPassword, updatePassword };
