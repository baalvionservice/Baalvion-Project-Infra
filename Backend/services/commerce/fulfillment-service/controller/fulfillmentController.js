'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const shipmentService = require('../service/shipmentService');
const shippingService = require('../service/shippingService');

const listShipments = async (req, res, next) => { try { return sendPaginated(req, res, await shipmentService.listShipments(req.params.storeId, req.query)); } catch (err) { return next(err); } };
const getShipment = async (req, res, next) => { try { return sendSuccess(req, res, await shipmentService.getShipment(req.params.storeId, req.params.shipmentId)); } catch (err) { return next(err); } };
const createShipment = async (req, res, next) => { try { return sendSuccess(req, res, await shipmentService.createShipment(req.params.storeId, req.validated), 201); } catch (err) { return next(err); } };
const updateShipment = async (req, res, next) => { try { return sendSuccess(req, res, await shipmentService.updateShipment(req.params.storeId, req.params.shipmentId, req.validated)); } catch (err) { return next(err); } };
const addTrackingEvent = async (req, res, next) => { try { return sendSuccess(req, res, await shipmentService.addTrackingEvent(req.params.storeId, req.params.shipmentId, req.validated), 201); } catch (err) { return next(err); } };

const listZones = async (req, res, next) => { try { return sendPaginated(req, res, await shippingService.listZones(req.params.storeId, req.query)); } catch (err) { return next(err); } };
const createZone = async (req, res, next) => { try { return sendSuccess(req, res, await shippingService.createZone(req.params.storeId, req.validated), 201); } catch (err) { return next(err); } };
const updateZone = async (req, res, next) => { try { return sendSuccess(req, res, await shippingService.updateZone(req.params.storeId, req.params.zoneId, req.validated)); } catch (err) { return next(err); } };
const deleteZone = async (req, res, next) => { try { await shippingService.deleteZone(req.params.storeId, req.params.zoneId); return sendSuccess(req, res, null, 204); } catch (err) { return next(err); } };
const addRate = async (req, res, next) => { try { return sendSuccess(req, res, await shippingService.addRate(req.params.storeId, req.params.zoneId, req.validated), 201); } catch (err) { return next(err); } };
const updateRate = async (req, res, next) => { try { return sendSuccess(req, res, await shippingService.updateRate(req.params.storeId, req.params.rateId, req.validated)); } catch (err) { return next(err); } };
const deleteRate = async (req, res, next) => { try { await shippingService.deleteRate(req.params.storeId, req.params.rateId); return sendSuccess(req, res, null, 204); } catch (err) { return next(err); } };
const listCouriers = async (req, res, next) => { try { return sendSuccess(req, res, await shippingService.listCouriers(req.params.storeId)); } catch (err) { return next(err); } };
const createCourier = async (req, res, next) => { try { return sendSuccess(req, res, await shippingService.createCourier(req.params.storeId, req.validated), 201); } catch (err) { return next(err); } };
const updateCourier = async (req, res, next) => { try { return sendSuccess(req, res, await shippingService.updateCourier(req.params.storeId, req.params.courierId, req.validated)); } catch (err) { return next(err); } };

module.exports = { listShipments, getShipment, createShipment, updateShipment, addTrackingEvent, listZones, createZone, updateZone, deleteZone, addRate, updateRate, deleteRate, listCouriers, createCourier, updateCourier };
