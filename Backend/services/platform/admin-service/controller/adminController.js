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
        await adminService.suspendUser(userId, req.auth.userId);
        sendSuccess(req, res, { message: 'User suspended' });
    } catch (err) { next(err); }
};

exports.unsuspendUser = async (req, res, next) => {
    try {
        await adminService.unsuspendUser(req.params.userId, req.auth.userId);
        sendSuccess(req, res, { message: 'User unsuspended' });
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

exports.impersonate = async (req, res, next) => {
    try {
        const { userId: targetUserId } = req.params;
        const result = await adminService.createImpersonationToken(req.auth.userId, targetUserId);
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
        await adminService.revokeSessionAdmin(req.params.sessionId, req.auth.userId);
        sendSuccess(req, res, { message: 'Session revoked' });
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
