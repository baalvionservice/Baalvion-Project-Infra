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

module.exports = router;
