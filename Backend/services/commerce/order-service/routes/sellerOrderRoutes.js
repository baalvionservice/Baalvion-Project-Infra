'use strict';
const { Router } = require('express');
const svc = require('../service/sellerOrderService');
const { validate } = require('../middleware/validate');
const { sendSuccess } = require('../utils/response');
const { rateBuyerSchema, sellerStatusSchema } = require('../validators/sellerOrderSchemas');
const { createShipmentSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

// Mounted behind authMiddleware. Scoping to the caller's own products happens in the service.
router.get('/orders', async (req, res, next) => {
    try { return sendSuccess(req, res, await svc.listSellerOrders(req.params.storeId, req.auth.userId, req.query)); }
    catch (err) { return next(err); }
});

router.post('/orders/:orderId/rate-buyer', validate(rateBuyerSchema), async (req, res, next) => {
    try { return sendSuccess(req, res, await svc.rateBuyer(req.params.storeId, req.auth.userId, req.params.orderId, req.validated), 201); }
    catch (err) { return next(err); }
});

router.patch('/orders/:orderId/status', validate(sellerStatusSchema), async (req, res, next) => {
    try { return sendSuccess(req, res, await svc.setStatus(req.params.storeId, req.auth.userId, req.params.orderId, req.validated.status)); }
    catch (err) { return next(err); }
});

router.post('/orders/:orderId/shipments', validate(createShipmentSchema), async (req, res, next) => {
    try { return sendSuccess(req, res, await svc.addShipment(req.params.storeId, req.auth.userId, req.params.orderId, req.validated), 201); }
    catch (err) { return next(err); }
});

module.exports = router;
