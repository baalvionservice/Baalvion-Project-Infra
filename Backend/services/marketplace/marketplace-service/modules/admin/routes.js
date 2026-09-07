'use strict';
// Admin / platform oversight. Staff gate (the in-service PEP); cross-cutting authz is also
// enforceable via rbac-service's PDP. Lists share the same pagination + sorting contract as
// the public resources via parseListQuery.
const router = require('express').Router();
const { z } = require('zod');
const db = require('../../models');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validate');
const { sendSuccess, sendPaginated, sendDeleted } = require('../../utils/response');
const { AppError } = require('../../utils/errors');
const { parseListQuery, paginate } = require('../../utils/query');
const { isStaff, isPlatform } = require('../../utils/authz');
const investorInvitationService = require('../../service/investorInvitationService');
const { withPlatformScope } = require('../../models/adminDb');

const requireStaff = (req, res, next) => (isStaff(req.user) ? next() : next(new AppError('FORBIDDEN', 'Compliance/admin role required', 403)));

router.use(authMiddleware, requireStaff);

// Platform roles see every org; org-scoped staff see only their own org.
const scope = (req) => (isPlatform(req.user) ? {} : { org_id: req.user.orgId });
const adminQuery = (sortable) => ({ sortable, defaultLimit: 50, maxLimit: 200 });

// ── Companies ────────────────────────────────────────────────────────────────
const COMPANY_SORTABLE = ['created_at', 'updated_at', 'legal_name', 'stage', 'status'];
// A PLATFORM reviewer's queue is every org's companies, which RLS hides from the app connection —
// the review list came back empty, so there was nothing to approve. Platform staff read it over
// the privileged connection; org-scoped staff still read their own through the normal path.
router.get('/companies', async (req, res, next) => {
    try {
        const { order, limit, offset, page } = parseListQuery(req.query, adminQuery(COMPANY_SORTABLE));
        if (isPlatform(req.user)) {
            const status = req.query.status;
            const result = await withPlatformScope(async (client) => {
                const params = [];
                let where = '';
                if (status) { params.push(status); where = `WHERE status = $${params.length}`; }
                const total = await client.query(`SELECT count(*)::int AS n FROM marketplace.companies ${where}`, params);
                params.push(limit, offset);
                const rows = await client.query(
                    `SELECT * FROM marketplace.companies ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
                    params,
                );
                return { rows: rows.rows, count: total.rows[0].n };
            });
            return sendPaginated(req, res, paginate({ ...result, page, limit }));
        }
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
// Approving a company is inherently CROSS-ORG: the reviewer is platform staff, the company is
// someone else's tenant. On the app connection RLS hides the row entirely, so this reported
// "Company not found" for a record that plainly exists — the review workflow was impossible, not
// merely restricted. Runs on the privileged connection (models/adminDb.js); the staff guard above
// is still what decides who may call it.
router.patch('/companies/:id/review', validate({ body: reviewSchema }), async (req, res, next) => {
    try {
        const data = req.valid.body;
        const row = await withPlatformScope(async (client) => {
            const found = await client.query('SELECT id, status, kyc_status FROM marketplace.companies WHERE id = $1', [req.params.id]);
            if (!found.rows.length) return { notFound: true };
            const current = found.rows[0];
            if (current.status === 'approved' || current.status === 'rejected') return { conflict: current.status };
            const status = data.action === 'approve' ? 'approved' : 'rejected';
            const kyc = data.kyc_status || (data.action === 'approve' ? 'verified' : current.kyc_status);
            const updated = await client.query(
                'UPDATE marketplace.companies SET status = $1, kyc_status = $2, updated_at = now() WHERE id = $3 RETURNING *',
                [status, kyc, req.params.id],
            );
            return { company: updated.rows[0] };
        });
        if (row.notFound) return next(new AppError('NOT_FOUND', 'Company not found', 404));
        if (row.conflict) return next(new AppError('CONFLICT', `Already ${row.conflict}`, 409));
        return sendSuccess(req, res, row.company);
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

// ── Investor invitations (admin-triggered onboarding invites) ─────────────────
const sendInvestorInviteSchema = z.object({
    email: z.string().email(),
    investorType: z.enum(['angel', 'vc', 'family_office', 'pe', 'institutional', 'corporate', 'strategic']).default('angel'),
    note: z.string().max(1000).optional(),
});
router.get('/investors/invitations', async (req, res, next) => {
    try {
        const result = await investorInvitationService.listInvitations({
            orgId: req.user.orgId, isPlatform: isPlatform(req.user), query: req.query,
        });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
});
router.post('/investors/invitations', validate({ body: sendInvestorInviteSchema }), async (req, res, next) => {
    try {
        const row = await investorInvitationService.sendInvitation({
            orgId: req.user.orgId,
            data: req.valid.body,
            // req.user only carries id/orgId/roles — sendInvitation falls back to a
            // generic inviter name when no name/email is resolvable here.
            invitedBy: { id: req.user.id },
        });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.delete('/investors/invitations/:id', async (req, res, next) => {
    try {
        const result = await investorInvitationService.revokeInvitation({
            orgId: req.user.orgId, isPlatform: isPlatform(req.user), id: req.params.id,
        });
        return sendDeleted(req, res, result);
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
