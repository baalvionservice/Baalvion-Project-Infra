'use strict';
const router = require('express').Router();
const { z } = require('zod');
const db = require('../../models');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../utils/errors');

// Staff gate: only platform/compliance roles may review onboarding. (Cross-cutting
// authz also enforceable via rbac-service PDP; this is the in-service PEP.)
const STAFF = ['super_admin', 'owner', 'admin', 'compliance', 'platform_admin'];
const isStaff = (req) => Array.isArray(req.user?.roles) && req.user.roles.some((r) => STAFF.includes(r));
const isPlatform = (req) => Array.isArray(req.user?.roles) && req.user.roles.some((r) => ['super_admin', 'owner', 'platform_admin'].includes(r));
const requireStaff = (req, res, next) => isStaff(req) ? next() : next(new AppError('FORBIDDEN', 'Compliance/admin role required', 403));

router.use(authMiddleware, requireStaff);

const page = (req) => ({ p: Number(req.query.page) || 1, l: Math.min(Number(req.query.limit) || 50, 200) });
// Platform roles see every org; org-scoped staff see only their org.
const scope = (req) => (isPlatform(req) ? {} : { org_id: req.user.orgId });

// ── Companies ────────────────────────────────────────────────────────────────
router.get('/companies', async (req, res, next) => {
    try {
        const { p, l } = page(req);
        const where = { ...scope(req) };
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Company.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: l, offset: (p - 1) * l });
        return sendPaginated(req, res, { items: rows, total: count, page: p, limit: l, totalPages: Math.ceil(count / l) });
    } catch (err) { return next(err); }
});

const reviewSchema = z.object({
    action: z.enum(['approve', 'reject']),
    kyc_status: z.enum(['pending', 'in_review', 'verified', 'failed']).optional(),
    note: z.string().max(5000).optional(),
});
router.patch('/companies/:id/review', async (req, res, next) => {
    try {
        const parsed = reviewSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const c = await db.Company.findByPk(req.params.id);
        if (!c) return next(new AppError('NOT_FOUND', 'Company not found', 404));
        if (c.status === 'approved' || c.status === 'rejected') return next(new AppError('CONFLICT', `Already ${c.status}`, 409));
        await c.update({
            status: parsed.data.action === 'approve' ? 'approved' : 'rejected',
            kyc_status: parsed.data.kyc_status || (parsed.data.action === 'approve' ? 'verified' : c.kyc_status),
        });
        return sendSuccess(req, res, c);
    } catch (err) { return next(err); }
});

// ── Investors ────────────────────────────────────────────────────────────────
router.get('/investors', async (req, res, next) => {
    try {
        const { p, l } = page(req);
        const where = { ...scope(req) };
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Investor.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: l, offset: (p - 1) * l });
        return sendPaginated(req, res, { items: rows, total: count, page: p, limit: l, totalPages: Math.ceil(count / l) });
    } catch (err) { return next(err); }
});

const investorReviewSchema = z.object({
    action: z.enum(['approve', 'reject']),
    kyc_status: z.enum(['pending', 'in_review', 'verified', 'failed']).optional(),
    aml_status: z.enum(['pending', 'review', 'clear', 'hit']).optional(),
    accreditation_status: z.enum(['pending', 'in_review', 'verified', 'rejected']).optional(),
    note: z.string().max(5000).optional(),
});
router.patch('/investors/:id/review', async (req, res, next) => {
    try {
        const parsed = investorReviewSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const inv = await db.Investor.findByPk(req.params.id);
        if (!inv) return next(new AppError('NOT_FOUND', 'Investor not found', 404));
        if (inv.status === 'approved' || inv.status === 'rejected') return next(new AppError('CONFLICT', `Already ${inv.status}`, 409));
        const approve = parsed.data.action === 'approve';
        await inv.update({
            status: approve ? 'approved' : 'rejected',
            kyc_status: parsed.data.kyc_status || (approve ? 'verified' : inv.kyc_status),
            aml_status: parsed.data.aml_status || (approve ? 'clear' : inv.aml_status),
            accreditation_status: parsed.data.accreditation_status || (approve ? 'verified' : inv.accreditation_status),
        });
        return sendSuccess(req, res, inv);
    } catch (err) { return next(err); }
});

// ── Deals monitor (platform oversight) — deals + their escrow summary ─────────
router.get('/deals', async (req, res, next) => {
    try {
        const { p, l } = page(req);
        const where = {};
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Deal.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: l, offset: (p - 1) * l });
        const ids = rows.map((d) => d.id);
        const escrows = ids.length ? await db.EscrowTransaction.findAll({ where: { deal_id: ids } }) : [];
        const byDeal = {};
        for (const e of escrows) (byDeal[e.deal_id] ||= []).push({ id: e.id, amount: e.amount, currency: e.currency, status: e.status });
        const items = rows.map((d) => ({ ...d.toJSON(), escrow: byDeal[d.id] || [] }));
        return sendPaginated(req, res, { items, total: count, page: p, limit: l, totalPages: Math.ceil(count / l) });
    } catch (err) { return next(err); }
});

// ── Opportunities (all, with company) ─────────────────────────────────────────
router.get('/opportunities', async (req, res, next) => {
    try {
        const { p, l } = page(req);
        const where = {};
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Opportunity.findAndCountAll({
            where, include: [{ model: db.Company, as: 'company' }], order: [['created_at', 'DESC']], limit: l, offset: (p - 1) * l, distinct: true,
        });
        return sendPaginated(req, res, { items: rows, total: count, page: p, limit: l, totalPages: Math.ceil(count / l) });
    } catch (err) { return next(err); }
});

module.exports = router;
