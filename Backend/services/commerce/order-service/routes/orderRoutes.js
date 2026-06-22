'use strict';
const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controller/orderController');
const shipmentCtrl = require('../controller/shipmentController');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema, recordPaymentSchema, refundPaymentSchema, createPaymentIntentSchema, confirmPaymentSchema, createShipmentSchema, updateShipmentSchema, lookupOrderSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

// Guest order-lookup limiter: email+orderNumber is a (weak) guessing surface, so cap it well below
// the global IP limit. Defence in depth — the orderNumber already embeds CSPRNG bytes (non-enumerable).
// Env-overridable, safe non-prod default.
const orderLookupLimit = rateLimit({
    windowMs: 60_000,
    max: Number(process.env.ORDER_LOOKUP_RL_MAX || 12),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many order lookups, please slow down' } },
});

// ── Admin surface (RBAC store-scoped) ──────────────────────────────────────────
// The router is mounted under optionalAuth (guest checkout), so these admin routes RE-APPLY
// authMiddleware to require a valid token (a guest hitting them is 401'd before RBAC runs).
// Listing all orders in a store exposes cross-tenant data → also require a store role.
router.get('/', authMiddleware, loadStoreRole, requireStoreRole('store_viewer'), ctrl.listOrders);
router.patch('/:orderId/status', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(updateOrderStatusSchema), ctrl.updateOrderStatus);
router.post('/:orderId/cancel', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(cancelOrderSchema), ctrl.cancelOrder);
router.post('/:orderId/payments', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(recordPaymentSchema), ctrl.recordPayment);
router.post('/:orderId/refund', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(refundPaymentSchema), ctrl.refundPayment);
// Shipment tracking — admin/ops writes (RBAC store-scoped).
router.post('/:orderId/shipments', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(createShipmentSchema), shipmentCtrl.createShipment);
router.patch('/shipments/:shipmentId/tracking', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(updateShipmentSchema), shipmentCtrl.updateShipmentTracking);

// ── Shopper / checkout surface (guest-capable; NOT store-role gated) ───────────
// Authenticated → bound to the user; guest → bound to a signed X-Cart-Session (same mechanism as
// carts). Ownership (owner OR guest-session OR staff) is enforced in the service layer, never here.
// Gating these with a store-admin role would break storefront checkout.
router.post('/', validate(createOrderSchema), ctrl.createOrder);
// PUBLIC guest order tracking (no auth, no guest session): look up an order by email + orderNumber.
// Rate-limited + schema-validated. A distinct literal path, so it never collides with POST '/' or
// the GET '/:orderId' param route. Lets a returning guest track an order after losing their session.
router.post('/lookup', orderLookupLimit, validate(lookupOrderSchema), ctrl.lookupOrder);
// Customer-facing "my orders". MUST precede GET '/:orderId' so 'mine' is not parsed as an order id.
// authMiddleware is re-applied (router is optionalAuth) so a guest is 401'd — there is no "my orders" for a guest.
router.get('/mine', authMiddleware, ctrl.listMyOrders);
router.get('/:orderId', ctrl.getOrder);
// Customer-readable shipment tracking for an order. No store-role gate (inherits optionalAuth);
// ownership (owner OR guest-session OR staff) is enforced in shipmentService.listOrderShipments.
router.get('/:orderId/shipments', shipmentCtrl.listShipments);
router.post('/:orderId/payments/intent', validate(createPaymentIntentSchema), ctrl.createPaymentIntent);
router.post('/:orderId/payments/confirm', validate(confirmPaymentSchema), ctrl.confirmPayment);

module.exports = router;
