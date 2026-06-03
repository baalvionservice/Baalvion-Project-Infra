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
    try { return sendSuccess(req, res, await orderService.createPaymentIntent(req.params.storeId, req.params.orderId, actorOf(req)), 201); }
    catch (err) { return next(err); }
};

const confirmPayment = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.confirmPayment(req.params.storeId, req.params.orderId, req.body && req.body.intentId, actorOf(req))); }
    catch (err) { return next(err); }
};

module.exports = { listOrders, listMyOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, recordPayment, refundPayment, createPaymentIntent, confirmPayment };
