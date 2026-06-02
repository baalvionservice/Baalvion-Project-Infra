'use strict';
const { Router } = require('express');
const ctrl = require('../controller/orderController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema, recordPaymentSchema, refundPaymentSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

// ── Admin surface (RBAC store-scoped) ──────────────────────────────────────────
// Listing all orders in a store exposes cross-tenant data → require a store role.
router.get('/', loadStoreRole, requireStoreRole('store_viewer'), ctrl.listOrders);
router.patch('/:orderId/status', loadStoreRole, requireStoreRole('ops_manager'), validate(updateOrderStatusSchema), ctrl.updateOrderStatus);
router.post('/:orderId/cancel', loadStoreRole, requireStoreRole('ops_manager'), validate(cancelOrderSchema), ctrl.cancelOrder);
router.post('/:orderId/payments', loadStoreRole, requireStoreRole('ops_manager'), validate(recordPaymentSchema), ctrl.recordPayment);
router.post('/:orderId/refund', loadStoreRole, requireStoreRole('ops_manager'), validate(refundPaymentSchema), ctrl.refundPayment);

// ── Shopper / checkout surface (authenticated customer; NOT store-role gated) ──
// Gating these with a store-admin role would break storefront checkout. Customer-ownership
// scoping (a customer may only see their own order) is a separate follow-up.
router.post('/', validate(createOrderSchema), ctrl.createOrder);
router.get('/:orderId', ctrl.getOrder);
router.post('/:orderId/payments/intent', ctrl.createPaymentIntent);
router.post('/:orderId/payments/confirm', ctrl.confirmPayment);

module.exports = router;
