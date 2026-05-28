'use strict';
const sessionService            = require('../service/sessionService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError }              = require('../utils/errors');

// ── User-facing endpoints ─────────────────────────────────────────────────────

exports.listMySessions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, includeRevoked } = req.query;
        const result = await sessionService.listUserSessions(req.auth.userId, {
            page:           Math.max(1, parseInt(page, 10)),
            limit:          Math.min(100, Math.max(1, parseInt(limit, 10))),
            includeRevoked: includeRevoked === 'true',
        });
        sendPaginated(req, res, result.items, result.total, result.page, result.limit);
    } catch (err) { next(err); }
};

exports.getMySessionStats = async (req, res, next) => {
    try {
        const stats = await sessionService.getUserSessionStats(req.auth.userId);
        sendSuccess(req, res, stats);
    } catch (err) { next(err); }
};

exports.getMySessionDetail = async (req, res, next) => {
    try {
        const session = await sessionService.getSessionDetail(req.params.sessionId, req.auth.userId);
        sendSuccess(req, res, session);
    } catch (err) { next(err); }
};

exports.revokeMySession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        if (sessionId === req.auth.sessionId) {
            throw new AppError('INVALID_REQUEST', 'Use /logout to end your current session', 400);
        }
        await sessionService.revokeSession(sessionId, req.auth.userId, false);
        sendSuccess(req, res, { message: 'Session revoked' });
    } catch (err) { next(err); }
};

exports.revokeAllOtherSessions = async (req, res, next) => {
    try {
        await sessionService.revokeAllSessions(req.auth.userId, req.auth.sessionId);
        sendSuccess(req, res, { message: 'All other sessions revoked' });
    } catch (err) { next(err); }
};

// ── Internal endpoint — called by auth-service after login ───────────────────

exports.analyseLogin = async (req, res, next) => {
    try {
        const { sessionId, userId, ipAddress, userAgent } = req.body;
        if (!sessionId || !userId) throw new AppError('VALIDATION_ERROR', 'sessionId and userId required', 400);
        const risk = await sessionService.analyseLoginEvent({ sessionId, userId, ipAddress, userAgent });
        sendSuccess(req, res, risk, 201);
    } catch (err) { next(err); }
};

// ── Admin endpoints ───────────────────────────────────────────────────────────

exports.adminListAllSessions = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, userId, orgId, riskLevel } = req.query;
        const result = await sessionService.listAllSessions({
            page:      Math.max(1, parseInt(page, 10)),
            limit:     Math.min(200, Math.max(1, parseInt(limit, 10))),
            userId:    userId    || undefined,
            orgId:     orgId     || undefined,
            riskLevel: riskLevel || undefined,
        });
        sendPaginated(req, res, result.items, result.total, result.page, result.limit);
    } catch (err) { next(err); }
};

exports.adminGetSessionDetail = async (req, res, next) => {
    try {
        const session = await sessionService.getSessionDetail(req.params.sessionId, null);
        sendSuccess(req, res, session);
    } catch (err) { next(err); }
};

exports.adminRevokeSession = async (req, res, next) => {
    try {
        await sessionService.revokeSession(req.params.sessionId, req.auth.userId, true);
        sendSuccess(req, res, { message: 'Session revoked' });
    } catch (err) { next(err); }
};

exports.adminGetUserSessions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, includeRevoked } = req.query;
        const result = await sessionService.listUserSessions(req.params.userId, {
            page:           Math.max(1, parseInt(page, 10)),
            limit:          Math.min(200, Math.max(1, parseInt(limit, 10))),
            includeRevoked: includeRevoked === 'true',
        });
        sendPaginated(req, res, result.items, result.total, result.page, result.limit);
    } catch (err) { next(err); }
};
