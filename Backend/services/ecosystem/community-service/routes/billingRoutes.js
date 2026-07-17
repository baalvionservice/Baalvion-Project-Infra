'use strict';
const { Router } = require('express');
const ctrl = require('../controller/billingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireInternalSecret } = require('../middleware/internalAuth');

const router = Router();

router.post('/communities/:slug/checkout', authMiddleware, ctrl.checkout);
// Called by payment-service's BillingFulfillmentClient (server-to-server, x-internal-secret) —
// never by a browser, never behind the platform gateway.
router.post('/billing/fulfill', requireInternalSecret, ctrl.fulfill);

module.exports = router;
