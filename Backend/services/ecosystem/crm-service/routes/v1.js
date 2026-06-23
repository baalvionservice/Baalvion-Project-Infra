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

module.exports = router;
