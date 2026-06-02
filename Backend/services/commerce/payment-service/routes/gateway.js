'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/gatewayController');

// Authed gateway-checkout endpoints (mounted at /v1/gateway).
const router = Router();
router.post('/payments', ctrl.createPayment);
router.get('/payments/:id', ctrl.getPayment);
router.post('/payments/:id/refund', ctrl.refundPayment);

module.exports = router;
