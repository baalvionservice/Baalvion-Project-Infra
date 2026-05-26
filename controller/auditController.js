'use strict';
const db = require('../models');
const { verifyChain } = require('../utils/audit');
const { sendPaginated, sendSuccess } = require('../utils/response');

// Tenant-scoped audit listing (admins/operators).
const listAudit = async (req, res, next) => {
    try {
        const { actorId, action, resourceType, page = 1, limit = 100 } = req.query;
        const where = {};
        if (req.auth?.tenantId) where.tenantId = req.auth.tenantId;
        if (actorId) where.actorId = actorId;
        if (action) where.action = action;
        if (resourceType) where.resourceType = resourceType;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.AuditLog.findAndCountAll({
            where, limit: Number(limit), offset, order: [['seq', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) { return next(err); }
};

// Recompute the hash chain → tamper detection.
const verify = async (req, res, next) => {
    try {
        const result = await verifyChain();
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { listAudit, verify };
