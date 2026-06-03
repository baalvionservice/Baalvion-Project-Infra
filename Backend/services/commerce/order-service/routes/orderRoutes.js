'use strict';
const { Router } = require('express');
const ctrl = require('../controller/orderController');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema, recordPaymentSchema, refundPaymentSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

// ── Admin surface (RBAC store-scoped) ──────────────────────────────────────────
// The router is mounted under optionalAuth (guest checkout), so these admin routes RE-APPLY
// authMiddleware to require a valid token (a guest hitting them is 401'd before RBAC runs).
// Listing all orders in a store exposes cross-tenant data → also require a store role.
router.get('/', authMiddleware, loadStoreRole, requireStoreRole('store_viewer'), ctrl.listOrders);
router.patch('/:orderId/status', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(updateOrderStatusSchema), ctrl.updateOrderStatus);
router.post('/:orderId/cancel', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(cancelOrderSchema), ctrl.cancelOrder);
router.post('/:orderId/payments', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(recordPaymentSchema), ctrl.recordPayment);
router.post('/:orderId/refund', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(refundPaymentSchema), ctrl.refundPayment);

// ── Shopper / checkout surface (guest-capable; NOT store-role gated) ───────────
// Authenticated → bound to the user; guest → bound to a signed X-Cart-Session (same mechanism as
// carts). Ownership (owner OR guest-session OR staff) is enforced in the service layer, never here.
// Gating these with a store-admin role would break storefront checkout.
router.post('/', validate(createOrderSchema), ctrl.createOrder);
router.get('/:orderId', ctrl.getOrder);
router.post('/:orderId/payments/intent', ctrl.createPaymentIntent);
router.post('/:orderId/payments/confirm', ctrl.confirmPayment);

module.exports = router;
