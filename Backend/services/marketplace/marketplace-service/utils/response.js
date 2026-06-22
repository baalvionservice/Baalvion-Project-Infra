'use strict';
const { v4: uuidv4 } = require('uuid');

// Consistent response envelope: { success, data, meta } on success, { success, error } on
// failure. `meta.version` echoes the version negotiated by the apiVersion middleware.
const buildMeta = (req, extra = {}) => ({
    requestId: req.requestId || uuidv4(),
    timestamp: new Date().toISOString(),
    version: req.apiVersion || 'v1',
    ...extra,
});

const sendSuccess = (req, res, data, status = 200, meta = {}) =>
    res.status(status).json({ success: true, data, meta: buildMeta(req, meta) });

const sendPaginated = (req, res, payload) =>
    res.status(200).json({ success: true, data: payload, meta: buildMeta(req) });

// 200 with a small acknowledgement body (soft-deletes/archives return the new state).
const sendDeleted = (req, res, data = { deleted: true }) =>
    res.status(200).json({ success: true, data, meta: buildMeta(req) });

const sendError = (req, res, error) =>
    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message,
            details: error.details || {},
            requestId: req.requestId,
        },
    });

module.exports = { sendSuccess, sendPaginated, sendDeleted, sendError };
