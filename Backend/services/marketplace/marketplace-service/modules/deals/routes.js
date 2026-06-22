'use strict';
// Deals — thin controllers over ../../service/dealService. The deal-room lifecycle (NDA gate,
// versioned term sheets, escrow → cap-table issuance) lives entirely in the service.
//
// Authorization: the two collection routes (`POST /`, `GET /`) use authMiddleware directly.
// Everything operating on a specific deal is mounted under the `/:dealId` guard below, which
// authenticates AND enforces deal-room membership — so individual deal-scoped routes do not
// repeat authMiddleware.
const router = require('express').Router();
const { authMiddleware } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validate');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const service = require('../../service/dealService');
const s = require('./schemas');

// ── Deal lifecycle (collection) ───────────────────────────────────────────────
router.post('/', authMiddleware, validate({ body: s.createSchema }), async (req, res, next) => {
    try {
        const deal = await service.create({ data: req.valid.body, user: req.user });
        return sendSuccess(req, res, deal, 201);
    } catch (err) { return next(err); }
});

// ?page,?limit,?sort,?order,?status
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const result = await service.list({ orgId: req.user.orgId, query: req.query });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
});

// Deal-room access guard — authenticates, then restricts every deal-scoped route below to the
// deal's parties (the two principal orgs, an added deal member, or staff). `req.deal` is set.
const dealAccess = async (req, res, next) => {
    try {
        req.deal = await service.assertDealAccess(req.params.dealId, req.user);
        return next();
    } catch (err) { return next(err); }
};
router.use('/:dealId', authMiddleware, dealAccess);

router.get('/:dealId', async (req, res, next) => {
    try { return sendSuccess(req, res, req.deal); } catch (err) { return next(err); }
});

router.patch('/:dealId', validate({ body: s.statusSchema }), async (req, res, next) => {
    try {
        const deal = await service.updateStatus({ id: req.params.dealId, status: req.valid.body.status });
        return sendSuccess(req, res, deal);
    } catch (err) { return next(err); }
});

// ── Chat ──────────────────────────────────────────────────────────────────────
router.get('/:dealId/messages', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listMessages(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/messages', validate({ body: s.messageSchema }), async (req, res, next) => {
    try {
        const row = await service.addMessage({ dealId: req.params.dealId, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// ── Members ─────────────────────────────────────────────────────────────────
router.get('/:dealId/members', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listMembers(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/members', validate({ body: s.memberSchema }), async (req, res, next) => {
    try {
        const row = await service.addMember({ dealId: req.params.dealId, data: req.valid.body });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// ── NDA gate ────────────────────────────────────────────────────────────────
router.get('/:dealId/nda', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listNda(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/nda', async (req, res, next) => {
    try {
        const nda = await service.signNda({ dealId: req.params.dealId, templateId: req.body.template_id, user: req.user });
        return sendSuccess(req, res, nda, 201);
    } catch (err) { return next(err); }
});

// ── Document requests (DD) ────────────────────────────────────────────────────
router.get('/:dealId/document-requests', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listDocumentRequests(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/document-requests', validate({ body: s.documentRequestSchema }), async (req, res, next) => {
    try {
        const row = await service.addDocumentRequest({ dealId: req.params.dealId, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.patch('/:dealId/document-requests/:rid', validate({ body: s.documentRequestStatusSchema }), async (req, res, next) => {
    try {
        const row = await service.updateDocumentRequest({ dealId: req.params.dealId, requestId: req.params.rid, status: req.valid.body.status });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// ── Data room (gated) ─────────────────────────────────────────────────────────
router.get('/:dealId/documents', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listDataRoom({ dealId: req.params.dealId, user: req.user })); } catch (err) { return next(err); }
});
router.post('/:dealId/documents', validate({ body: s.dataRoomDocSchema }), async (req, res, next) => {
    try {
        const row = await service.addDataRoomDocument({ dealId: req.params.dealId, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// ── Access grants ─────────────────────────────────────────────────────────────
router.get('/:dealId/access-grants', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listAccessGrants(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/access-grants', validate({ body: s.accessGrantSchema }), async (req, res, next) => {
    try {
        const row = await service.addAccessGrant({ dealId: req.params.dealId, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// ── Due diligence ─────────────────────────────────────────────────────────────
router.get('/:dealId/due-diligence', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.dueDiligence(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/due-diligence', validate({ body: s.dueDiligenceSchema }), async (req, res, next) => {
    try {
        const row = await service.addDueDiligenceItem({ dealId: req.params.dealId, data: req.valid.body });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.patch('/:dealId/due-diligence/:itemId', validate({ body: s.dueDiligenceUpdateSchema }), async (req, res, next) => {
    try {
        const row = await service.updateDueDiligenceItem({ dealId: req.params.dealId, itemId: req.params.itemId, data: req.valid.body });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// ── Term sheets + versioning ──────────────────────────────────────────────────
router.get('/:dealId/term-sheets', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listTermSheets(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/term-sheets', validate({ body: s.termVersionSchema }), async (req, res, next) => {
    try {
        const row = await service.createTermSheet({ dealId: req.params.dealId, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.post('/:dealId/term-sheets/:tsId/versions', validate({ body: s.termCounterSchema }), async (req, res, next) => {
    try {
        const row = await service.addTermSheetVersion({ dealId: req.params.dealId, termSheetId: req.params.tsId, body: req.valid.body, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// ── E-signature ───────────────────────────────────────────────────────────────
router.get('/:dealId/signatures', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listSignatures(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/signatures', validate({ body: s.signatureSchema }), async (req, res, next) => {
    try {
        const row = await service.createSignature({ dealId: req.params.dealId, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.post('/:dealId/signatures/:sid/complete', async (req, res, next) => {
    try {
        const row = await service.completeSignature({ dealId: req.params.dealId, signatureId: req.params.sid });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// ── Escrow ────────────────────────────────────────────────────────────────────
router.get('/:dealId/escrow', async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listEscrow(req.params.dealId)); } catch (err) { return next(err); }
});
router.post('/:dealId/escrow', validate({ body: s.escrowSchema }), async (req, res, next) => {
    try {
        const row = await service.createEscrow({ dealId: req.params.dealId, data: req.valid.body });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.post('/:dealId/escrow/:eid/fund', async (req, res, next) => {
    try {
        const row = await service.fundEscrow({ dealId: req.params.dealId, escrowId: req.params.eid });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});
// Release additionally requires a staff role (enforced in the service).
router.post('/:dealId/escrow/:eid/release', async (req, res, next) => {
    try {
        const result = await service.releaseEscrow({ dealId: req.params.dealId, escrowId: req.params.eid, user: req.user });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
});

module.exports = router;
