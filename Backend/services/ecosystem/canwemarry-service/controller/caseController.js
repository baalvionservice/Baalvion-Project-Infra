'use strict';
const caseService = require('../service/caseService');
const participantService = require('../service/participantService');
const supportService = require('../service/supportService');
const caseUpdateService = require('../service/caseUpdateService');
const accessContext = require('../service/accessContext');
const audit = require('../service/auditService');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');
const relatedService = require('../service/relatedService');

// Every handler resolves the access context first. Nothing in this controller reads a case
// without one — that is the invariant the visibility rules depend on.
const ctxOf = (req) => accessContext.build(req);

const list = asyncHandler(async (req, res) => {
    const { page, pageSize, ...filters } = q(req);
    const { items, total } = await caseService.list(await ctxOf(req), { page, pageSize, ...filters });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const get = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await caseService.get(await ctxOf(req), req.params.id)));

const getByReference = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await caseService.getByReference(await ctxOf(req), req.params.reference)));

const create = asyncHandler(async (req, res) => {
    const created = await caseService.create(await ctxOf(req), req.body);
    await audit.record(req, { action: 'case.created', entityType: 'CASE', entityId: created.id, metadata: { visibility: created.visibility } });
    return sendSuccess(req, res, created, 201);
});

const update = asyncHandler(async (req, res) => {
    const updated = await caseService.update(await ctxOf(req), req.params.id, req.body);
    // Audience changes are recorded specifically: widening a case is the change most worth
    // being able to reconstruct later.
    if (req.body.visibility) {
        await audit.record(req, { action: 'case.visibility_changed', entityType: 'CASE', entityId: updated.id, metadata: { visibility: updated.visibility } });
    }
    return sendSuccess(req, res, updated);
});

const remove = asyncHandler(async (req, res) => {
    const result = await caseService.remove(await ctxOf(req), req.params.id);
    await audit.record(req, { action: 'case.deleted', entityType: 'CASE', entityId: req.params.id });
    return sendSuccess(req, res, result);
});

// ── Participants and consent ─────────────────────────────────────────────────
const listParticipants = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await participantService.listForCase(await ctxOf(req), req.params.id)));

const inviteParticipant = asyncHandler(async (req, res) => {
    const created = await participantService.invite(await ctxOf(req), req.params.id, req.body);
    await audit.record(req, { action: 'case.participant.invited', entityType: 'CASE', entityId: req.params.id, metadata: { relation: req.body.relation } });
    return sendSuccess(req, res, created, 201);
});

const respondToInvitation = asyncHandler(async (req, res) => {
    const updated = await participantService.respond(await ctxOf(req), req.params.id, req.params.participantId, req.body.decision);
    await audit.record(req, { action: `case.consent.${req.body.decision.toLowerCase()}`, entityType: 'CASE', entityId: req.params.id });
    return sendSuccess(req, res, updated);
});

const withdrawConsent = asyncHandler(async (req, res) => {
    const updated = await participantService.withdraw(await ctxOf(req), req.params.id, req.params.participantId);
    await audit.record(req, { action: 'case.consent.withdrawn', entityType: 'CASE', entityId: req.params.id });
    return sendSuccess(req, res, updated);
});

// ── Support ──────────────────────────────────────────────────────────────────
const listSupporters = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await supportService.listForCase(await ctxOf(req), req.params.id)));

const offerSupport = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await supportService.offer(await ctxOf(req), req.params.id, req.body.message), 201));

const decideSupport = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await supportService.decide(await ctxOf(req), req.params.id, req.params.supporterId, req.body.decision)));

const withdrawSupport = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await supportService.withdraw(await ctxOf(req), req.params.id)));

const revokeSupporter = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await supportService.revoke(await ctxOf(req), req.params.id, req.params.supporterId)));

// ── Owner-authored updates ───────────────────────────────────────────────────
const listUpdates = asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 20 } = q(req);
    const { items, total } = await caseUpdateService.list(await ctxOf(req), req.params.id, { page, pageSize });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const createUpdate = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await caseUpdateService.create(await ctxOf(req), req.params.id, req.body.body), 201));

const deleteUpdate = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await caseUpdateService.remove(await ctxOf(req), req.params.id, req.params.updateId)));

/**
 * Material related to a case: resources, other communities, other cases.
 *
 * Authorization is the service's, and it re-reads the case under the caller's own rule — an
 * id they may not see answers 404 here exactly as it does on the case itself, so this cannot
 * be used to confirm that a case exists.
 */
const related = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await relatedService.forCase(await accessContext.build(req), req.params.id)));

module.exports = {
    related,
    list, get, getByReference, create, update, remove,
    listUpdates, createUpdate, deleteUpdate,
    listParticipants, inviteParticipant, respondToInvitation, withdrawConsent,
    listSupporters, offerSupport, decideSupport, withdrawSupport, revokeSupporter,
};