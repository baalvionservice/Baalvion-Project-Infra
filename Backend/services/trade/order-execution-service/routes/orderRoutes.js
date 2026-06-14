'use strict';
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { tenant, requireTenant } = require('../middleware/tenant');
const c = require('../controller/orderController');

// F1: auth establishes req.auth BEFORE tenant resolves the tenant context.
router.use(authMiddleware, tenant);

// War Room 3: confirm-payment triggers a REAL settlement (payment_requested outbox
// event → payment-service ledger double-entry). Only a role authorized to spend org
// funds may confirm — viewer/member/support/supplier roles must not move money.
// The role set is configurable via PAYMENT_CONFIRM_ROLES (comma-separated).
const PAYMENT_CONFIRM_ROLES = (process.env.PAYMENT_CONFIRM_ROLES
    || 'admin,owner,super_admin,finance_officer,trader')
    .split(',').map((r) => r.trim()).filter(Boolean);
const canConfirmPayment = requireRole(...PAYMENT_CONFIRM_ROLES);

router.get('/', requireTenant, c.listOrders);
router.get('/:id', requireTenant, c.getOrder);
router.get('/:id/timeline', requireTenant, c.getTimeline);
router.post('/', requireTenant, c.createOrder);
router.post('/:id/confirm-payment', requireTenant, canConfirmPayment, c.confirmPayment);

module.exports = router;
