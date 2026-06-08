'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { tenant, requireTenant } = require('../middleware/tenant');
const c = require('../controller/orderController');

// F1: auth establishes req.auth BEFORE tenant resolves the tenant context.
router.use(authMiddleware, tenant);

router.get('/', requireTenant, c.listOrders);
router.get('/:id', requireTenant, c.getOrder);
router.get('/:id/timeline', requireTenant, c.getTimeline);
router.post('/', requireTenant, c.createOrder);
router.post('/:id/confirm-payment', requireTenant, c.confirmPayment);

module.exports = router;
