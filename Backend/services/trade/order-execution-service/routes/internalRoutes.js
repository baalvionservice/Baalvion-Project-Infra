'use strict';
const router = require('express').Router();
const internal = require('../controller/internalController');

// HMAC-authenticated; NOT a user route. No authMiddleware/tenant — trusted writer.
router.post('/finance-events', internal.financeEvents);

module.exports = router;
