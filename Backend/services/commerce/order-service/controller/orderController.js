'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const orderService = require('../service/orderService');

const listOrders = async (req, res, next) => {
    try { return sendPaginated(req, res, await orderService.listOrders(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};

const getOrder = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.getOrder(req.params.storeId, req.params.orderId)); }
    catch (err) { return next(err); }
};

const createOrder = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.createOrder(req.params.storeId, req.validated), 201); }
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

const createPaymentIntent = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.createPaymentIntent(req.params.storeId, req.params.orderId), 201); }
    catch (err) { return next(err); }
};

const confirmPayment = async (req, res, next) => {
    try { return sendSuccess(req, res, await orderService.confirmPayment(req.params.storeId, req.params.orderId, req.body && req.body.intentId)); }
    catch (err) { return next(err); }
};

module.exports = { listOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, recordPayment, createPaymentIntent, confirmPayment };
