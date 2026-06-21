'use strict';
// Admin / platform oversight. Staff gate (the in-service PEP); cross-cutting authz is also
// enforceable via rbac-service's PDP. Lists share the same pagination + sorting contract as
// the public resources via parseListQuery.
const router = require('express').Router();
const { z } = require('zod');
const db = require('../../models');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validate');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../utils/errors');
const { parseListQuery, paginate } = require('../../utils/query');
const { isStaff, isPlatform } = require('../../utils/authz');

const requireStaff = (req, res, next) => (isStaff(req.user) ? next() : next(new AppError('FORBIDDEN', 'Compliance/admin role required', 403)));

router.use(authMiddleware, requireStaff);

// Platform roles see every org; org-scoped staff see only their own org.
const scope = (req) => (isPlatform(req.user) ? {} : { org_id: req.user.orgId });
const adminQuery = (sortable) => ({ sortable, defaultLimit: 50, maxLimit: 200 });

// ── Companies ────────────────────────────────────────────────────────────────
const COMPANY_SORTABLE = ['created_at', 'updated_at', 'legal_name', 'stage', 'status'];
router.get('/companies', async (req, res, next) => {
    try {
        const { order, limit, offset, page } = parseListQuery(req.query, adminQuery(COMPANY_SORTABLE));
        const where = { ...scope(req) };
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Company.findAndCountAll({ where, order, limit, offset });
        return sendPaginated(req, res, paginate({ rows, count, page, limit }));
    } catch (err) { return next(err); }
});

const reviewSchema = z.object({
    action: z.enum(['approve', 'reject']),
    kyc_status: z.enum(['pending', 'in_review', 'verified', 'failed']).optional(),
    note: z.string().max(5000).optional(),
});
router.patch('/companies/:id/review', validate({ body: reviewSchema }), async (req, res, next) => {
    try {
        const data = req.valid.body;
        const c = await db.Company.findByPk(req.params.id);
        if (!c) return next(new AppError('NOT_FOUND', 'Company not found', 404));
        if (c.status === 'approved' || c.status === 'rejected') return next(new AppError('CONFLICT', `Already ${c.status}`, 409));
        await c.update({
            status: data.action === 'approve' ? 'approved' : 'rejected',
            kyc_status: data.kyc_status || (data.action === 'approve' ? 'verified' : c.kyc_status),
        });
        return sendSuccess(req, res, c);
    } catch (err) { return next(err); }
});

// ── Investors ────────────────────────────────────────────────────────────────
const INVESTOR_SORTABLE = ['created_at', 'updated_at', 'legal_name', 'type', 'status'];
router.get('/investors', async (req, res, next) => {
    try {
        const { order, limit, offset, page } = parseListQuery(req.query, adminQuery(INVESTOR_SORTABLE));
        const where = { ...scope(req) };
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Investor.findAndCountAll({ where, order, limit, offset });
        return sendPaginated(req, res, paginate({ rows, count, page, limit }));
    } catch (err) { return next(err); }
});

const investorReviewSchema = z.object({
    action: z.enum(['approve', 'reject']),
    kyc_status: z.enum(['pending', 'in_review', 'verified', 'failed']).optional(),
    aml_status: z.enum(['pending', 'review', 'clear', 'hit']).optional(),
    accreditation_status: z.enum(['pending', 'in_review', 'verified', 'rejected']).optional(),
    note: z.string().max(5000).optional(),
});
router.patch('/investors/:id/review', validate({ body: investorReviewSchema }), async (req, res, next) => {
    try {
        const data = req.valid.body;
        const inv = await db.Investor.findByPk(req.params.id);
        if (!inv) return next(new AppError('NOT_FOUND', 'Investor not found', 404));
        if (inv.status === 'approved' || inv.status === 'rejected') return next(new AppError('CONFLICT', `Already ${inv.status}`, 409));
        const approve = data.action === 'approve';
        await inv.update({
            status: approve ? 'approved' : 'rejected',
            kyc_status: data.kyc_status || (approve ? 'verified' : inv.kyc_status),
            aml_status: data.aml_status || (approve ? 'clear' : inv.aml_status),
            accreditation_status: data.accreditation_status || (approve ? 'verified' : inv.accreditation_status),
        });
        return sendSuccess(req, res, inv);
    } catch (err) { return next(err); }
});

// ── Deals monitor (platform oversight) — deals + their escrow summary ─────────
const DEAL_SORTABLE = ['created_at', 'updated_at', 'status'];
router.get('/deals', async (req, res, next) => {
    try {
        const { order, limit, offset, page } = parseListQuery(req.query, adminQuery(DEAL_SORTABLE));
        const where = {};
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Deal.findAndCountAll({ where, order, limit, offset });
        const ids = rows.map((d) => d.id);
        const escrows = ids.length ? await db.EscrowTransaction.findAll({ where: { deal_id: ids } }) : [];
        const byDeal = {};
        for (const e of escrows) (byDeal[e.deal_id] ||= []).push({ id: e.id, amount: e.amount, currency: e.currency, status: e.status });
        const items = rows.map((d) => ({ ...d.toJSON(), escrow: byDeal[d.id] || [] }));
        return sendPaginated(req, res, paginate({ rows: items, count, page, limit }));
    } catch (err) { return next(err); }
});

// ── Opportunities (all, with company) ─────────────────────────────────────────
const OPP_SORTABLE = ['created_at', 'updated_at', 'published_at', 'title', 'status', 'amount_sought'];
router.get('/opportunities', async (req, res, next) => {
    try {
        const { order, limit, offset, page } = parseListQuery(req.query, adminQuery(OPP_SORTABLE));
        const where = {};
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Opportunity.findAndCountAll({
            where, include: [{ model: db.Company, as: 'company' }], order, limit, offset, distinct: true,
        });
        return sendPaginated(req, res, paginate({ rows, count, page, limit }));
    } catch (err) { return next(err); }
});

module.exports = router;
