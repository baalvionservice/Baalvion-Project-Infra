'use strict';
// Internal service-to-service ingress (HMAC-authenticated, not user JWT). Mounted at /v1/internal.
const router = require('express').Router();
const internal = require('../controller/internalController');

// Java (financial-services-java) → trade-service finance event bridge.
router.post('/finance-events', internal.financeEvents);

// order-execution -> trade-service: open the journey for a confirmed order (signed, see service/journey/internalAuth.js).
router.post('/order-journeys', require('../controller/orderJourneyController').openFromOrder);

module.exports = router;
