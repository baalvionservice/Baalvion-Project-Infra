'use strict';
const reportService = require('../service/reportService');
const audit = require('../service/auditService');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');

const ctx = (req) => ({ actor: req.actor });

const create = asyncHandler(async (req, res) => {
    const created = await reportService.create(ctx(req), req.body);
    await audit.record(req, {
        action: 'report.created',
        entityType: req.body.targetType,
        entityId: req.body.targetId,
        metadata: { reason: created.reason, severity: created.severity },
    });
    return sendSuccess(req, res, created, 201);
});

/** What the reporter can see about their own reports — outcome only, never the queue. */
const listMine = asyncHandler(async (req, res) => {
    const { page, pageSize } = q(req);
    const { items, total } = await reportService.listMine(ctx(req), { page, pageSize });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

// ── Moderator queue ──────────────────────────────────────────────────────────
const listQueue = asyncHandler(async (req, res) => {
    const { page, pageSize, status, severity, reason, targetType, unresolved, sort } = q(req);
    const { items, total } = await reportService.list({
        page, pageSize, status, severity, reason, targetType, unresolved, sort,
    });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const get = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await reportService.get(req.params.id)));

const review = asyncHandler(async (req, res) => {
    const updated = await reportService.review(ctx(req), req.params.id, req.body);
    await audit.record(req, {
        action: 'report.reviewed',
        entityType: 'REPORT',
        entityId: updated.id,
        metadata: { status: updated.status, severity: updated.severity },
    });
    return sendSuccess(req, res, updated);
});

module.exports = { create, listMine, listQueue, get, review };
