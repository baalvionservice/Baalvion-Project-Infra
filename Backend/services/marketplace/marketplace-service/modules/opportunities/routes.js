'use strict';
const router = require('express').Router();
const { z } = require('zod');
const db = require('../../models');
const { authMiddleware, optionalAuth } = require('../../middleware/authMiddleware');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../utils/errors');
const { recommendForInvestor } = require('../matching/service');

const createSchema = z.object({
    company_id: z.string().uuid(),
    title: z.string().min(2).max(300),
    round: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'growth']).optional(),
    amount_sought: z.coerce.number().min(0).optional(),
    pre_money_valuation: z.coerce.number().min(0).optional(),
    equity_offered_pct: z.coerce.number().min(0).max(100).optional(),
    min_ticket: z.coerce.number().min(0).optional(),
    deadline: z.string().optional(),
});

// Public discovery — live opportunities, filterable by round + company industry/stage/country.
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const where = { status: 'live', visibility: 'public' };
        if (req.query.round) where.round = req.query.round;
        if (req.query.max_min_ticket) where.min_ticket = { [db.Sequelize.Op.lte]: Number(req.query.max_min_ticket) };

        const companyWhere = {};
        if (req.query.industry) companyWhere.industry_code = req.query.industry;
        if (req.query.stage) companyWhere.stage = req.query.stage;
        if (req.query.country) companyWhere.country = req.query.country;

        const { count, rows } = await db.Opportunity.findAndCountAll({
            where,
            include: [{ model: db.Company, as: 'company', required: true, where: Object.keys(companyWhere).length ? companyWhere : undefined }],
            order: [['published_at', 'DESC']], limit, offset: (page - 1) * limit, distinct: true,
        });
        return sendPaginated(req, res, { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) });
    } catch (err) { return next(err); }
});

// AI-recommended opportunities for the authenticated investor (by ?investorId or org).
router.get('/recommended', authMiddleware, async (req, res, next) => {
    try {
        let investorId = req.query.investorId;
        if (!investorId) {
            const inv = await db.Investor.findOne({ where: { org_id: req.user.orgId } });
            investorId = inv?.id;
        }
        if (!investorId) return sendSuccess(req, res, { items: [], note: 'No investor profile for caller — pass ?investorId' });
        const result = await recommendForInvestor(investorId, { limit: Number(req.query.limit) || 20 });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const row = await db.Opportunity.findByPk(req.params.id, { include: [{ model: db.Company, as: 'company' }] });
        if (!row) return next(new AppError('NOT_FOUND', 'Opportunity not found', 404));
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Company publishes a round (draft).
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const company = await db.Company.findByPk(parsed.data.company_id);
        if (!company) return next(new AppError('NOT_FOUND', 'Company not found', 404));
        const row = await db.Opportunity.create({ ...parsed.data, org_id: company.org_id, status: 'draft' });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// Go live — only an approved company may publish.
router.post('/:id/publish', authMiddleware, async (req, res, next) => {
    try {
        const opp = await db.Opportunity.findByPk(req.params.id);
        if (!opp) return next(new AppError('NOT_FOUND', 'Opportunity not found', 404));
        const company = await db.Company.findByPk(opp.company_id);
        if (!company || company.status !== 'approved') {
            return next(new AppError('PRECONDITION_FAILED', 'Company must be approved before publishing', 412));
        }
        await opp.update({ status: 'live', published_at: new Date() });
        return sendSuccess(req, res, opp);
    } catch (err) { return next(err); }
});

module.exports = router;
