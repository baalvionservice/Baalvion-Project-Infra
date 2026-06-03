'use strict';
// Feature-flags console controller. Mirrors adminController.js: thin try/catch
// handlers that delegate to the service and emit the standard response envelope
// (sendSuccess / sendPaginated). Mutations pass req.auth.userId + req.ip for audit.
const featureFlagsService = require('../service/featureFlagsService');
const { sendSuccess, sendPaginated } = require('../utils/response');

// GET /admin/feature-flags
// feature-flags.ts is typed PaginatedResponse<FeatureFlag> = { success, data: T[], pagination }
// (the query reads r.data.data as the array + r.data.pagination), consistent with the
// support/developer/ai modules — so emit that shape directly rather than sendPaginated's
// { data: { items } } envelope.
exports.listFlags = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page ?? '1', 10));
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '50', 10)));
        const result = await featureFlagsService.listFlags({ page, limit });
        const total = Number.isFinite(result.total) ? result.total : (result.items?.length ?? 0);
        const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
            requestId: req.requestId,
        });
    } catch (err) { next(err); }
};

// GET /admin/feature-flags/:id
exports.getFlag = async (req, res, next) => {
    try {
        const flag = await featureFlagsService.getFlag(req.params.id);
        sendSuccess(req, res, flag);
    } catch (err) { next(err); }
};

// POST /admin/feature-flags
exports.createFlag = async (req, res, next) => {
    try {
        const {
            key, name, description, enabled, rolloutPercent,
            environments, targetOrgIds, targetUserIds, metadata,
        } = req.body || {};
        const flag = await featureFlagsService.createFlag(
            { key, name, description, enabled, rolloutPercent, environments, targetOrgIds, targetUserIds, metadata },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, flag, 201);
    } catch (err) { next(err); }
};

// PATCH /admin/feature-flags/:id  (also serves toggle — toggle sends { enabled })
exports.updateFlag = async (req, res, next) => {
    try {
        const {
            key, name, description, enabled, rolloutPercent,
            environments, targetOrgIds, targetUserIds, metadata,
        } = req.body || {};
        const flag = await featureFlagsService.updateFlag(
            req.params.id,
            { key, name, description, enabled, rolloutPercent, environments, targetOrgIds, targetUserIds, metadata },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, flag);
    } catch (err) { next(err); }
};

// DELETE /admin/feature-flags/:id
exports.deleteFlag = async (req, res, next) => {
    try {
        const result = await featureFlagsService.deleteFlag(req.params.id, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};
