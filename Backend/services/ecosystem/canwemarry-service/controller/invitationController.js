'use strict';
const invitationService = require('../service/invitationService');
const accessContext = require('../service/accessContext');
const audit = require('../service/auditService');
const { asyncHandler } = require('./asyncHandler');
const { sendSuccess } = require('../utils/response');

const ctxOf = (req) => accessContext.build(req);

// ── Owner side ───────────────────────────────────────────────────────────────
const create = asyncHandler(async (req, res) => {
    const created = await invitationService.create(await ctxOf(req), req.params.id, req.body);
    // The relation is recorded, the code is not — an audit trail that stored the token would
    // reintroduce the very exposure hashing it prevents.
    await audit.record(req, {
        action: 'case.invitation.created',
        entityType: 'CASE',
        entityId: req.params.id,
        metadata: { relation: created.relation, expiresAt: created.expiresAt },
    });
    return sendSuccess(req, res, created, 201);
});

const listForCase = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await invitationService.listForCase(await ctxOf(req), req.params.id)));

const revoke = asyncHandler(async (req, res) => {
    const revoked = await invitationService.revoke(await ctxOf(req), req.params.id, req.params.invitationId);
    await audit.record(req, { action: 'case.invitation.revoked', entityType: 'CASE', entityId: req.params.id });
    return sendSuccess(req, res, revoked);
});

const listMine = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await invitationService.listMine(await ctxOf(req))));

// ── Holder side ──────────────────────────────────────────────────────────────
/** What a code-holder may see before deciding. No case content, by design. */
const preview = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await invitationService.preview(req.params.token)));

const accept = asyncHandler(async (req, res) => {
    const result = await invitationService.accept(await ctxOf(req), req.params.token);
    await audit.record(req, { action: 'case.invitation.accepted', entityType: 'CASE', entityId: result.caseId });
    return sendSuccess(req, res, result, 201);
});

const decline = asyncHandler(async (req, res) => {
    const result = await invitationService.decline(await ctxOf(req), req.params.token);
    await audit.record(req, { action: 'case.invitation.declined', entityType: 'INVITATION' });
    return sendSuccess(req, res, result);
});

module.exports = { create, listForCase, revoke, listMine, preview, accept, decline };
