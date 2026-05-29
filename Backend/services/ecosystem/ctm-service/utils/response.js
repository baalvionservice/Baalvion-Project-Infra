'use strict';
const { v4: uuidv4 } = require('uuid');

// Response helpers are res-first to match every controller call site:
//   sendSuccess(res, data, status?, meta?)
//   sendPaginated(res, rows, total, page?, limit?)
//   sendError(res, error)
// Request-scoped metadata (requestId/latency) is read off res.req so callers
// don't have to thread `req` through.

const buildMeta = (res, extra = {}) => {
    const req = (res && res.req) || {};
    return {
        requestId: req.requestId || uuidv4(),
        timestamp: new Date().toISOString(),
        latency: req.startTime ? Date.now() - req.startTime : 0,
        version: 'v1',
        ...extra,
    };
};

const sendSuccess = (res, data, status = 200, meta = {}) =>
    res.status(status).json({ success: true, data, meta: buildMeta(res, meta) });

const sendPaginated = (res, rows, total, page = 1, limit = 20) =>
    res.status(200).json({
        success: true,
        data: rows,
        total,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        meta: buildMeta(res, {
            pagination: {
                total: total || 0,
                page: Number(page) || 1,
                limit: Number(limit) || 20,
                totalPages: Math.ceil((total || 0) / (Number(limit) || 20)),
            },
        }),
    });

const sendError = (res, error) =>
    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message,
            details: error.details || {},
            requestId: (res.req && res.req.requestId) || undefined,
        },
    });

module.exports = { sendSuccess, sendPaginated, sendError };
