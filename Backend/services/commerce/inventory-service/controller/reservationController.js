'use strict';
const { sendSuccess } = require('../utils/response');
const reservationService = require('../service/reservationService');

// Bind the hold to the authenticated shopper (req.auth.userId) when present — a logged-in caller can
// NEVER attribute a hold to another user via a client-supplied userId. An anonymous (guest) caller
// keeps the optional client userId (a guest cart hold); a short TTL bounds guest abuse.
const lock = async (req, res, next) => {
    try {
        const authedUserId = req.auth && req.auth.userId != null ? req.auth.userId : null;
        const userId = authedUserId != null ? authedUserId : (req.validated.userId ?? null);
        return sendSuccess(req, res, await reservationService.lock({ storeId: req.params.storeId, ...req.validated, userId }), 201);
    } catch (err) { return next(err); }
};
const release = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.release(req.params.lockId)); } catch (err) { return next(err); } };
const confirm = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.confirm(req.params.lockId, req.validated.orderId)); } catch (err) { return next(err); } };
const getStock = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.getStock(req.params.storeId, req.params.variantId)); } catch (err) { return next(err); } };
const getBulkStock = async (req, res, next) => { try { return sendSuccess(req, res, await reservationService.getBulkStock(req.params.storeId, req.validated.variantIds)); } catch (err) { return next(err); } };

module.exports = { lock, release, confirm, getStock, getBulkStock };
