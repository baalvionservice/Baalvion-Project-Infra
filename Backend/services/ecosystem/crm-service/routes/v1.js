'use strict';
const { Router } = require('express');
const db = require('../models');
const { makeController, DEFAULT_BRAND } = require('../controller/crudController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const {
    validateBody,
    appointmentCreateSchema,
    supportTicketCreateSchema,
    inquiryCreateSchema,
    inquiryMessageSchema,
} = require('../middleware/validate');

const router = Router();

// Per-entity controllers (DRY factory).
const vip = makeController(db.VipClient, { searchable: ['name', 'email'] });
const segments = makeController(db.Segment, { searchable: ['name'] });
const campaigns = makeController(db.Campaign, { searchable: ['title'] });
const vendors = makeController(db.Vendor, { searchable: ['name', 'category'] });
const affiliates = makeController(db.Affiliate, { searchable: ['name', 'referralCode'] });
const appointments = makeController(db.Appointment, { searchable: ['customerName', 'city'], defaultOrder: 'date' });
const supportTickets = makeController(db.SupportTicket, { searchable: ['customerName', 'subject'], defaultOrder: 'updated_at' });
const inquiries = makeController(db.Inquiry, { searchable: ['customerName', 'email'], defaultOrder: 'updated_at' });

/**
 * Mount one entity with standard CRUD. List/read require auth by default (CRM data is
 * privileged), writes require auth. Pass `publicCreate` to allow anonymous create (used by
 * the storefront appointment booking form). Pass `createValidator` (an Express middleware) to
 * validate the create body before the controller runs — used on the anonymous create surfaces
 * so unauthenticated public input is checked at the boundary.
 */
function mountEntity(base, ctrl, { publicCreate = false, createValidator = null } = {}) {
    router.get(`${base}`, authMiddleware, ctrl.list);
    router.get(`${base}/:id`, authMiddleware, ctrl.getOne);
    const createChain = [publicCreate ? optionalAuth : authMiddleware];
    if (createValidator) createChain.push(createValidator);
    createChain.push(ctrl.create);
    router.post(`${base}`, ...createChain);
    router.patch(`${base}/:id`, authMiddleware, ctrl.update);
    router.put(`${base}/:id`, authMiddleware, ctrl.update);
    router.delete(`${base}/:id`, authMiddleware, ctrl.remove);
}

// The logged-in client's own VIP record (storefront account area). Matched by userId, else email.
router.get('/crm/vip-clients/me', authMiddleware, async (req, res) => {
    const brandId = req.query.brandId || DEFAULT_BRAND;
    const { Op } = require('sequelize');
    const or = [];
    if (req.user?.id) or.push({ userId: String(req.user.id) });
    // The canonical token carries no email; storefronts may pass ?email= for the seeded demo data.
    if (req.query.email) or.push({ email: String(req.query.email) });
    if (!or.length) throw new AppError('BAD_REQUEST', 'No identity to resolve VIP record', 400);
    const row = await db.VipClient.findOne({ where: { brandId, [Op.or]: or } });
    return sendSuccess(req, res, row || null);
});

// Debit/credit the logged-in client's OWN wallet + append a ledger entry — server-resolves the
// row via req.user.id (same match as GET /me), so a caller can never touch another customer's
// wallet no matter what id they might otherwise supply. Deliberately NOT the generic PATCH
// /crm/vip-clients/:id (that route has no ownership check — any authenticated caller could edit
// ANY customer's record by id today; a documented pre-existing gap in the generic CRUD routes,
// out of scope to fix for all 7 entities here, but real writes from the storefront must not use it).
router.post('/crm/vip-clients/me/wallet', authMiddleware, async (req, res) => {
    const brandId = req.query.brandId || DEFAULT_BRAND;
    const deltaAmount = Number(req.body?.deltaAmount);
    const note = String(req.body?.note || '').trim();
    if (!Number.isFinite(deltaAmount) || deltaAmount === 0) {
        throw new AppError('VALIDATION_ERROR', 'deltaAmount must be a non-zero finite number', 400);
    }
    if (!req.user?.id) throw new AppError('BAD_REQUEST', 'No identity to resolve VIP record', 400);
    const row = await db.VipClient.findOne({ where: { brandId, userId: String(req.user.id) } });
    if (!row) throw new AppError('NOT_FOUND', 'VIP record not found', 404);

    const nextBalance = Number(row.walletBalance) + deltaAmount;
    if (nextBalance < 0) throw new AppError('VALIDATION_ERROR', 'Insufficient wallet balance', 400);

    const entry = {
        id: `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        deltaAmount,
        balanceAfter: nextBalance,
        note,
        timestamp: new Date().toISOString(),
    };
    const walletHistory = Array.isArray(row.walletHistory) ? [...row.walletHistory, entry] : [entry];
    await row.update({ walletBalance: nextBalance, walletHistory });
    return sendSuccess(req, res, row);
});

mountEntity('/crm/vip-clients', vip);
mountEntity('/crm/segments', segments);
mountEntity('/crm/campaigns', campaigns);
mountEntity('/crm/vendors', vendors);
mountEntity('/crm/affiliates', affiliates);
mountEntity('/crm/appointments', appointments, {
    publicCreate: true,
    createValidator: validateBody(appointmentCreateSchema),
});
mountEntity('/crm/support-tickets', supportTickets, {
    publicCreate: true,
    createValidator: validateBody(supportTicketCreateSchema),
});
mountEntity('/crm/inquiries', inquiries, {
    publicCreate: true,
    createValidator: validateBody(inquiryCreateSchema),
});

// Staff follow-up queue: inquiries whose follow-up date has arrived (or passed) and aren't
// already closed out. This IS the "reminder" — a live, always-current queue rather than a
// separate scheduled-notification system, so there's nothing to go stale or fail to fire.
router.get('/crm/inquiries/due-for-follow-up', authMiddleware, async (req, res) => {
    const { Op } = require('sequelize');
    const brandId = req.query.brandId || DEFAULT_BRAND;
    const rows = await db.Inquiry.findAll({
        where: {
            brandId,
            followUpAt: { [Op.lte]: new Date() },
            status: { [Op.notIn]: ['won', 'lost'] },
        },
        order: [['followUpAt', 'ASC']],
        limit: 200,
    });
    return sendSuccess(req, res, rows);
});

// PII-safe guest lookup (mirrors order-service's guest order-lookup pattern): a customer who
// isn't staff-authenticated can still check the status/thread of THEIR OWN inquiry by proving
// they know the id AND the email it was raised under — never by id alone. Uniform 404 on any
// mismatch so the endpoint can't be used to enumerate other customers' inquiries.
router.get('/crm/inquiries/:id/mine', optionalAuth, async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) throw new AppError('BAD_REQUEST', 'email is required', 400);
    const row = await db.Inquiry.findByPk(req.params.id);
    if (!row || String(row.email || '').trim().toLowerCase() !== email) {
        throw new AppError('NOT_FOUND', 'Inquiry not found', 404);
    }
    return sendSuccess(req, res, row);
});

// Append ONE message to the inquiry's thread. optionalAuth (guests can message their own
// inquiry, same trust boundary as creating it); the row itself is looked up by id only here
// since this is a write a client already holds the direct link to (from their own create
// response / email), not a general read surface.
router.post(
    '/crm/inquiries/:id/messages',
    optionalAuth,
    validateBody(inquiryMessageSchema),
    async (req, res) => {
        const row = await db.Inquiry.findByPk(req.params.id);
        if (!row) throw new AppError('NOT_FOUND', 'Inquiry not found', 404);
        const entry = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            sender: req.body.sender,
            text: req.body.text,
            timestamp: new Date().toISOString(),
        };
        const messages = Array.isArray(row.messages) ? [...row.messages, entry] : [entry];
        await row.update({ messages });
        return sendSuccess(req, res, row, 201);
    }
);

module.exports = router;
