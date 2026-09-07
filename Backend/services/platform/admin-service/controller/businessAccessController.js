'use strict';
const svc = require('../service/businessAccessService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

/** The businesses and roles the console can offer — read by the grant picker. */
exports.getCatalog = async (req, res, next) => {
    try {
        sendSuccess(req, res, { businesses: svc.KNOWN_BUSINESSES, roles: svc.BUSINESS_ROLES });
    } catch (err) { next(err); }
};

/** Every live grant across everyone — one query for the console's People view. */
exports.listAll = async (req, res, next) => {
    try { sendSuccess(req, res, await svc.listAll()); }
    catch (err) { next(err); }
};

exports.listForUser = async (req, res, next) => {
    try { sendSuccess(req, res, await svc.listForUser(req.params.userId)); }
    catch (err) { next(err); }
};

exports.grant = async (req, res, next) => {
    try {
        const { userId, businesses, role, expiresAt } = req.body || {};
        if (!userId) throw new AppError('INVALID_REQUEST', 'userId is required', 400);
        if (!Array.isArray(businesses) || businesses.length === 0) {
            throw new AppError('INVALID_REQUEST', 'At least one business is required', 400);
        }
        // Bounded so one request cannot fan out into an unbounded write loop.
        if (businesses.length > 20) {
            throw new AppError('INVALID_REQUEST', 'At most 20 businesses per request', 400);
        }
        if (!role) throw new AppError('INVALID_REQUEST', 'A role is required', 400);

        const result = await svc.grant({
            userId, businesses, role, expiresAt: expiresAt ?? null,
            actorId: req.auth.userId, ipAddress: req.ip,
        });
        sendSuccess(req, res, result, 201);
    } catch (err) { next(err); }
};

/** DELETE ?business=trade removes one; omitting it removes every business (offboarding). */
exports.revoke = async (req, res, next) => {
    try {
        const result = await svc.revoke({
            userId: req.params.userId,
            business: req.query.business || null,
            actorId: req.auth.userId,
            ipAddress: req.ip,
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};
