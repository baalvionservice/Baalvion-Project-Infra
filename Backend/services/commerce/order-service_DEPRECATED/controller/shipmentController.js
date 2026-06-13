'use strict';
const { sendSuccess } = require('../utils/response');
const shipmentService = require('../service/shipmentService');
const { actorOf } = require('../utils/actor');

// Customer-readable: shipments for an order (ownership enforced in the service).
const listShipments = async (req, res, next) => {
    try { return sendSuccess(req, res, await shipmentService.listOrderShipments(req.params.storeId, req.params.orderId, actorOf(req))); }
    catch (err) { return next(err); }
};

const createShipment = async (req, res, next) => {
    try { return sendSuccess(req, res, await shipmentService.createShipment(req.params.storeId, req.params.orderId, req.validated), 201); }
    catch (err) { return next(err); }
};

const updateShipmentTracking = async (req, res, next) => {
    try { return sendSuccess(req, res, await shipmentService.updateShipmentTracking(req.params.storeId, req.params.shipmentId, req.validated)); }
    catch (err) { return next(err); }
};

module.exports = { listShipments, createShipment, updateShipmentTracking };
