'use strict';
const { randomUUID } = require('node:crypto');

const buildMeta = (req, extra = {}) => ({
    requestId: req.requestId || randomUUID(),
    timestamp: new Date().toISOString(),
    version: 'v1',
    ...extra,
});

const sendSuccess = (req, res, data, status = 200, meta = {}) =>
    res.status(status).json({ success: true, data, meta: buildMeta(req, meta) });

/**
 * Offset pagination. `total` is the count AFTER the visibility scope has been applied,
 * so it never reveals how many records the caller cannot see.
 */
const sendPaginated = (req, res, { items, total, page, pageSize }) =>
    res.status(200).json({
        success: true,
        data: items,
        meta: buildMeta(req, {
            pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
        }),
    });

const sendError = (req, res, error) =>
    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message,
            details: error.details || {},
        },
        meta: buildMeta(req),
    });

module.exports = { sendSuccess, sendPaginated, sendError, buildMeta };
