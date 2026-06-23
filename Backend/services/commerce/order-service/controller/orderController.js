'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const orderService = require('../service/orderService');
const { actorOf } = require('../utils/actor');

const listOrders = async (req, res, next) => {
    try { return sendPaginated(req, res, await orderService.listOrders(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};

const getOrder = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.getOrder(req.params.storeId, req.params.orderId, actorOf(req))); }
    catch (err) { return next(err); }
};

// PUBLIC guest order lookup/tracking (email + orderNumber). No auth/session — see lookupGuestOrder.
const lookupOrder = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.lookupGuestOrder(req.params.storeId, req.validated)); }
    catch (err) { return next(err); }
};

// Customer-facing: the authenticated shopper's own orders in this store.
const listMyOrders = async (req, res, next) => {
    try { return sendPaginated(req, res, await orderService.listMyOrders(req.params.storeId, req.auth && req.auth.userId, req.query)); }
    catch (err) { return next(err); }
};

const createOrder = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.createOrder(req.params.storeId, req.validated, actorOf(req)), 201); }
    catch (err) { return next(err); }
};

const updateOrderStatus = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.updateOrderStatus(req.params.storeId, req.params.orderId, req.validated.status, req.auth.userId)); }
    catch (err) { return next(err); }
};

const cancelOrder = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.cancelOrder(req.params.storeId, req.params.orderId, req.validated.reason)); }
    catch (err) { return next(err); }
};

const recordPayment = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.recordPayment(req.params.storeId, req.params.orderId, req.validated), 201); }
    catch (err) { return next(err); }
};

const refundPayment = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.refundPayment(req.params.storeId, req.params.orderId, req.validated), 201); }
    catch (err) { return next(err); }
};

const createPaymentIntent = async (req, res, next) => {
    try {
        const body = req.validated || req.body || {};
        return sendSuccess(req, res, await orderService.createPaymentIntent(req.params.storeId, req.params.orderId, actorOf(req), body.gateway || null), 201);
    } catch (err) { return next(err); }
};

const confirmPayment = async (req, res, next) => {
    try {
        const body = req.validated || req.body || {};
        // C1 contract: confirmPayment resolves the FULL updated order (top-level id + paymentStatus);
        // the FE treats it as PAID iff response.paymentStatus === 'paid'. `gateway` is recorded only.
        return sendSuccess(req, res, await orderService.confirmPayment(req.params.storeId, req.params.orderId, body.intentId, actorOf(req), body.verification, body.gateway || null));
    } catch (err) { return next(err); }
};

// Provider-initiated payment webhook (signature-verified by paymentWebhookAuth). Drives an order
// to failed/voided on an out-of-band gateway failure/cancellation. Returns the updated order.
const paymentWebhook = async (req, res, next) => {
    try {
        const body = req.validated || req.body || {};
        return sendSuccess(req, res, await orderService.handlePaymentWebhook(body));
    } catch (err) { return next(err); }
};

module.exports = { listOrders, listMyOrders, getOrder, lookupOrder, createOrder, updateOrderStatus, cancelOrder, recordPayment, refundPayment, createPaymentIntent, confirmPayment, paymentWebhook };
