'use strict';
const adminService = require('../service/adminService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

exports.getPlatformStats = async (req, res, next) => {
    try {
        const stats = await adminService.getPlatformStats();
        sendSuccess(req, res, stats);
    } catch (err) { next(err); }
};

exports.listUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;
        const result = await adminService.listUsers({
            page:   Math.max(1, parseInt(page, 10)),
            limit:  Math.min(200, Math.max(1, parseInt(limit, 10))),
            search: search || undefined,
            status: status || undefined,
        });
        sendPaginated(req, res, result.items, result.total, result.page, result.limit);
    } catch (err) { next(err); }
};

exports.getUserDetail = async (req, res, next) => {
    try {
        const user = await adminService.getUserDetail(req.params.userId);
        sendSuccess(req, res, user);
    } catch (err) { next(err); }
};

exports.suspendUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (userId === req.auth.userId) throw new AppError('INVALID_REQUEST', 'Cannot suspend yourself', 400);
        await adminService.suspendUser(userId, req.auth.userId, req.ip);
        sendSuccess(req, res, { message: 'User suspended' });
    } catch (err) { next(err); }
};

exports.unsuspendUser = async (req, res, next) => {
    try {
        await adminService.unsuspendUser(req.params.userId, req.auth.userId, req.ip);
        sendSuccess(req, res, { message: 'User unsuspended' });
    } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { fullName, full_name, avatarUrl, avatar_url, status } = req.body || {};
        const user = await adminService.updateUser(
            req.params.userId,
            { fullName, full_name, avatarUrl, avatar_url, status },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, user);
    } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const result = await adminService.deleteUser(req.params.userId, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.sendUserVerification = async (req, res, next) => {
    try {
        const result = await adminService.sendVerification(req.params.userId, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.revokeUserSessions = async (req, res, next) => {
    try {
        const result = await adminService.revokeUserSessions(req.params.userId, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.listOrgs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, search, plan } = req.query;
        const result = await adminService.listOrgs({
            page:   Math.max(1, parseInt(page, 10)),
            limit:  Math.min(200, Math.max(1, parseInt(limit, 10))),
            search: search || undefined,
            plan:   plan || undefined,
        });
        sendPaginated(req, res, result.items, result.total, result.page, result.limit);
    } catch (err) { next(err); }
};

exports.getOrgDetail = async (req, res, next) => {
    try {
        const org = await adminService.getOrgById(req.params.orgId);
        sendSuccess(req, res, org);
    } catch (err) { next(err); }
};

exports.createOrg = async (req, res, next) => {
    try {
        const { name, slug, plan, ownerId, owner_id } = req.body || {};
        const org = await adminService.createOrg(
            { name, slug, plan, ownerId: ownerId !== undefined ? ownerId : owner_id },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, org, 201);
    } catch (err) { next(err); }
};

exports.updateOrg = async (req, res, next) => {
    try {
        const { name, slug, plan } = req.body || {};
        const org = await adminService.updateOrg(req.params.orgId, { name, slug, plan }, req.auth.userId, req.ip);
        sendSuccess(req, res, org);
    } catch (err) { next(err); }
};

exports.deleteOrg = async (req, res, next) => {
    try {
        // Accept confirm via body or query (?confirm=true) — destructive, so it must be explicit.
        const confirm = req.body?.confirm === true || req.query?.confirm === 'true';
        const result = await adminService.deleteOrg(req.params.orgId, { confirm }, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.suspendOrg = async (req, res, next) => {
    try {
        const { reason } = req.body || {};
        const result = await adminService.suspendOrg(req.params.orgId, reason, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.impersonate = async (req, res, next) => {
    try {
        const { userId: targetUserId } = req.params;
        const result = await adminService.createImpersonationToken(req.auth.userId, targetUserId, req.ip);
        // Phase 9: frontend impersonation visibility. Non-httpOnly flag cookie + header so the
        // global banner can detect it; lifetime mirrors the (<=15m) impersonation token.
        res.cookie('baalvion_impersonation', '1', { httpOnly: false, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: (result.expiresIn || 900) * 1000 });
        res.setHeader('x-baalvion-impersonation', 'true');
        sendSuccess(req, res, result, 201);
    } catch (err) { next(err); }
};

exports.listAllSessions = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, userId, orgId } = req.query;
        const result = await adminService.listAllSessions({
            page:   Math.max(1, parseInt(page, 10)),
            limit:  Math.min(200, Math.max(1, parseInt(limit, 10))),
            userId: userId || undefined,
            orgId:  orgId  || undefined,
        });
        sendPaginated(req, res, result.items, result.total, result.page, result.limit);
    } catch (err) { next(err); }
};

exports.revokeSession = async (req, res, next) => {
    try {
        await adminService.revokeSessionAdmin(req.params.sessionId, req.auth.userId, req.ip);
        sendSuccess(req, res, { message: 'Session revoked' });
    } catch (err) { next(err); }
};

exports.getRiskEvents = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const result = await adminService.listRiskEvents({
            page:  Math.max(1, parseInt(page, 10)),
            limit: Math.min(100, Math.max(1, parseInt(limit, 10))),
        });
        // Frontend expects ApiResponse<PaginatedResponse<RiskEvent>> → wrap the
        // {success,data,pagination} object as the data payload.
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// Resolving a synthesized (audit-derived) risk event is a no-op ack for now.
exports.resolveRiskEvent = async (req, res, next) => {
    try {
        sendSuccess(req, res, { id: req.params.id, resolvedAt: new Date().toISOString() });
    } catch (err) { next(err); }
};

exports.getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, orgId, userId, action, severity, from, to } = req.query;
        const result = await adminService.getAuditLogs({
            page:     Math.max(1, parseInt(page, 10)),
            limit:    Math.min(200, Math.max(1, parseInt(limit, 10))),
            orgId:    orgId    || undefined,
            userId:   userId   || undefined,
            action:   action   || undefined,
            severity: severity || undefined,
            from:     from     || undefined,
            to:       to       || undefined,
        });
        sendPaginated(req, res, result.items, result.total, result.page, result.limit);
    } catch (err) { next(err); }
};
