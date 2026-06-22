'use strict';
// Companies — thin controllers. Validation lives in ./schemas via the `validate` middleware;
// business logic lives in ../../service/companyService.
const router = require('express').Router();
const { authMiddleware, optionalAuth } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validate');
const { sendSuccess, sendPaginated, sendDeleted } = require('../../utils/response');
const service = require('../../service/companyService');
const schemas = require('./schemas');

// Onboarding create (a founder registers their company).
router.post('/', optionalAuth, validate({ body: schemas.createSchema }), async (req, res, next) => {
    try {
        const row = await service.create({ data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// Staff/admin list (scoped to caller org) — supports ?page,?limit,?sort,?order,?status,?stage.
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const result = await service.list({ orgId: req.user.orgId, query: req.query });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const row = await service.getById(req.params.id);
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Update the core company record (legal_name, brand_name, etc.).
router.patch('/:id', authMiddleware, validate({ body: schemas.updateSchema }), async (req, res, next) => {
    try {
        const row = await service.update({ id: req.params.id, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Archive (soft-delete) — sets status=suspended, preserving FK-linked history.
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const result = await service.remove({ id: req.params.id, user: req.user });
        return sendDeleted(req, res, result);
    } catch (err) { return next(err); }
});

// Upsert the rich profile (summary, traction, funding ask, deck).
router.patch('/:id/profile', authMiddleware, validate({ body: schemas.profileSchema }), async (req, res, next) => {
    try {
        const row = await service.upsertProfile({ id: req.params.id, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Add a founder.
router.post('/:id/founders', authMiddleware, validate({ body: schemas.founderSchema }), async (req, res, next) => {
    try {
        const row = await service.addFounder({ id: req.params.id, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// Register an uploaded document (file already stored in S3 via @baalvion/upload → file_url).
router.post('/:id/documents', authMiddleware, validate({ body: schemas.documentSchema }), async (req, res, next) => {
    try {
        const row = await service.addDocument({ id: req.params.id, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// Cap table — current holdings + the event history that produced them.
router.get('/:id/cap-table', authMiddleware, async (req, res, next) => {
    try {
        const result = await service.capTable(req.params.id);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
});

// Submit for compliance/admin approval — triggers KYC.
router.post('/:id/submit', authMiddleware, async (req, res, next) => {
    try {
        const row = await service.submit({ id: req.params.id });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

module.exports = router;
