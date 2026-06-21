'use strict';
// Investors — thin controllers over ../../service/investorService.
const router = require('express').Router();
const { authMiddleware, optionalAuth } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validate');
const { sendSuccess, sendPaginated, sendDeleted } = require('../../utils/response');
const service = require('../../service/investorService');
const schemas = require('./schemas');

// Onboarding create — runs AML screening immediately and submits KYC.
router.post('/', optionalAuth, validate({ body: schemas.createSchema }), async (req, res, next) => {
    try {
        const { investor, aml } = await service.create({ data: req.valid.body, user: req.user });
        return sendSuccess(req, res, { ...investor.toJSON(), aml }, 201);
    } catch (err) { return next(err); }
});

// List (scoped to caller org) — supports ?page,?limit,?sort,?order,?status,?type.
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const result = await service.list({ orgId: req.user.orgId, query: req.query });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const row = await service.getById({ id: req.params.id, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Update the core investor record.
router.patch('/:id', authMiddleware, validate({ body: schemas.updateSchema }), async (req, res, next) => {
    try {
        const row = await service.update({ id: req.params.id, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Archive (soft-delete) — sets status=suspended.
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const result = await service.remove({ id: req.params.id, user: req.user });
        return sendDeleted(req, res, result);
    } catch (err) { return next(err); }
});

// Profile + preferences (upsert).
router.patch('/:id/profile', authMiddleware, validate({ body: schemas.profileSchema }), async (req, res, next) => {
    try {
        const row = await service.upsertProfile({ id: req.params.id, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

router.patch('/:id/preferences', authMiddleware, validate({ body: schemas.preferencesSchema }), async (req, res, next) => {
    try {
        const row = await service.upsertPreferences({ id: req.params.id, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Accreditation submission — moves status to in_review (verified by compliance).
router.post('/:id/accreditation', authMiddleware, async (req, res, next) => {
    try {
        const row = await service.submitAccreditation({ id: req.params.id, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// TODO(phase 7): portfolio holdings + ROI (joins cap_table + escrow).
router.get('/:id/portfolio', authMiddleware, async (req, res, next) => {
    try { return sendSuccess(req, res, { holdings: [], note: 'Portfolio — scaffolded (phase 7)' }); }
    catch (err) { return next(err); }
});

module.exports = router;
