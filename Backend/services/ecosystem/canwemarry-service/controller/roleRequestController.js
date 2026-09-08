'use strict';
const roleRequestService = require('../service/roleRequestService');
const audit = require('../service/auditService');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');

const ctx = (req) => ({ actor: req.actor });

// ── The applicant's side ─────────────────────────────────────────────────────

const create = asyncHandler(async (req, res) => {
    const created = await roleRequestService.create(ctx(req), req.body);
    await audit.record(req, {
        action: 'role_request.created',
        entityType: 'ROLE_REQUEST',
        entityId: created.id,
        // The role, never the reason: the audit trail is read by administrators, and the
        // applicant wrote that paragraph for the moderator reviewing it, not for the log.
        metadata: { role: created.role },
    });
    return sendSuccess(req, res, created, 201);
});

const listMine = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await roleRequestService.listMine(ctx(req))));

const withdraw = asyncHandler(async (req, res) => {
    const row = await roleRequestService.withdraw(ctx(req), req.params.id);
    await audit.record(req, { action: 'role_request.withdrawn', entityType: 'ROLE_REQUEST', entityId: row.id });
    return sendSuccess(req, res, row);
});

// ── The moderator's side ─────────────────────────────────────────────────────

const queue = asyncHandler(async (req, res) => {
    const { page, pageSize } = q(req);
    const { items, total } = await roleRequestService.queue({ status: req.query.status, page, pageSize });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const get = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await roleRequestService.get(req.params.id)));

const decide = asyncHandler(async (req, res) => {
    const decided = await roleRequestService.decide(ctx(req), req.params.id, req.body);
    await audit.record(req, {
        action: decided.status === 'APPROVED' ? 'role_request.approved' : 'role_request.declined',
        entityType: 'ROLE_REQUEST',
        entityId: decided.id,
        metadata: { role: decided.role },
    });
    return sendSuccess(req, res, decided);
});

module.exports = { create, listMine, withdraw, queue, get, decide };
