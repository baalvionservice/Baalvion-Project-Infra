'use strict';
const userService = require('../service/userService');
const caseService = require('../service/caseService');
const accessContext = require('../service/accessContext');
const audit = require('../service/auditService');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');

const listUsers = asyncHandler(async (req, res) => {
    const { page, pageSize, status } = q(req);
    const { items, total } = await userService.list({ page, pageSize, status });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const grantRole = asyncHandler(async (req, res) => {
    const result = await userService.grantRole({ actor: req.actor, userId: req.params.id, role: req.body.role });
    await audit.record(req, { action: 'role.granted', entityType: 'USER', entityId: req.params.id, metadata: { role: req.body.role } });
    return sendSuccess(req, res, result, result.created ? 201 : 200);
});

const revokeRole = asyncHandler(async (req, res) => {
    const result = await userService.revokeRole({ actor: req.actor, userId: req.params.id, role: req.body.role });
    await audit.record(req, { action: 'role.revoked', entityType: 'USER', entityId: req.params.id, metadata: { role: req.body.role } });
    return sendSuccess(req, res, result);
});

/**
 * The administrative case list.
 *
 * It runs through the SAME visibility scope as every other read — staff hold CASE_MODERATE,
 * which scopeWhere() answers with an unrestricted predicate. There is no second, privileged
 * query path that could drift away from the rules the rest of the service enforces.
 */
const listCases = asyncHandler(async (req, res) => {
    const { page, pageSize, ...filters } = q(req);
    const { items, total } = await caseService.list(await accessContext.build(req), { page, pageSize, ...filters });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const listAudit = asyncHandler(async (req, res) => {
    const { page, pageSize, actorId, entityType, action } = q(req);
    const { items, total } = await audit.list({ page, pageSize, actorId, entityType, action });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

module.exports = { listUsers, grantRole, revokeRole, listCases, listAudit };
