'use strict';
const { Router } = require('express');
const ctrl = require('../controller/billingController');
const { requireInternalSecret } = require('../middleware/internalAuth');

const router = Router();

// Called by payment-service's BillingFulfillmentClient (server-to-server, x-internal-secret) —
// never by a browser, never behind the platform gateway.
router.post('/billing/fulfill', requireInternalSecret, ctrl.fulfill);

module.exports = router;
