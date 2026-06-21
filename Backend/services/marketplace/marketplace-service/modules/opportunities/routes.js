'use strict';
// Opportunities — thin controllers over ../../service/opportunityService.
const router = require('express').Router();
const { authMiddleware, optionalAuth } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validate');
const { sendSuccess, sendPaginated, sendDeleted } = require('../../utils/response');
const service = require('../../service/opportunityService');
const schemas = require('./schemas');

// Public discovery — live opportunities, filterable + sortable.
// ?page,?limit,?sort,?order,?round,?industry,?stage,?country,?max_min_ticket
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const result = await service.listPublic({ query: req.query });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
});

// AI-recommended opportunities for the authenticated investor (by ?investorId or org).
router.get('/recommended', authMiddleware, async (req, res, next) => {
    try {
        const result = await service.recommended({
            investorId: req.query.investorId,
            orgId: req.user.orgId,
            limit: Number(req.query.limit) || undefined,
        });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const row = await service.getById(req.params.id);
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Company publishes a round (draft).
router.post('/', authMiddleware, validate({ body: schemas.createSchema }), async (req, res, next) => {
    try {
        const row = await service.create({ data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// Edit a draft round.
router.patch('/:id', authMiddleware, validate({ body: schemas.updateSchema }), async (req, res, next) => {
    try {
        const row = await service.update({ id: req.params.id, data: req.valid.body, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Delete a draft outright; archive a live/closed round (status=closed).
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const result = await service.remove({ id: req.params.id, user: req.user });
        return sendDeleted(req, res, result);
    } catch (err) { return next(err); }
});

// Go live — only an approved company may publish.
router.post('/:id/publish', authMiddleware, async (req, res, next) => {
    try {
        const row = await service.publish({ id: req.params.id, user: req.user });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

module.exports = router;
