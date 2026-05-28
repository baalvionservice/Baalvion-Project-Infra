'use strict';
const { Router } = require('express');
const ctrl = require('../controller/orderController');
const { validate } = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema, recordPaymentSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

router.get('/', ctrl.listOrders);
router.post('/', validate(createOrderSchema), ctrl.createOrder);

router.get('/:orderId', ctrl.getOrder);
router.patch('/:orderId/status', validate(updateOrderStatusSchema), ctrl.updateOrderStatus);
router.post('/:orderId/cancel', validate(cancelOrderSchema), ctrl.cancelOrder);
router.post('/:orderId/payments', validate(recordPaymentSchema), ctrl.recordPayment);
// Provider-authoritative payment flow (Phase 2): create intent, then backend-confirm.
router.post('/:orderId/payments/intent', ctrl.createPaymentIntent);
router.post('/:orderId/payments/confirm', ctrl.confirmPayment);

module.exports = router;
