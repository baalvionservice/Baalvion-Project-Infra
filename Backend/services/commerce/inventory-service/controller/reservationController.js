'use strict';
const { sendSuccess } = require('../utils/response');
const reservationService = require('../service/reservationService');

const lock = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.lock({ storeId: req.params.storeId, ...req.validated }), 201); } catch (err) { return next(err); } };
const release = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.release(req.params.lockId)); } catch (err) { return next(err); } };
const confirm = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.confirm(req.params.lockId, req.validated.orderId)); } catch (err) { return next(err); } };
const getStock = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.getStock(req.params.storeId, req.params.variantId)); } catch (err) { return next(err); } };
const getBulkStock = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.getBulkStock(req.params.storeId, req.validated.variantIds)); } catch (err) { return next(err); } };

module.exports = { lock, release, confirm, getStock, getBulkStock };
