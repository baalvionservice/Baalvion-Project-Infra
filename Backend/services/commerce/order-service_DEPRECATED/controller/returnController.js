'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const returnService = require('../service/returnService');
const { actorOf } = require('../utils/actor');

const listReturns = async (req, res, next) => {
    try { return sendPaginated(req, res, await returnService.listReturns(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};

// Customer-facing: the authenticated shopper's own returns in this store (IDOR-safe — scoped
// server-side by userId → customer, never a client-supplied customerId).
const listMyReturns = async (req, res, next) => {
    try { return sendPaginated(req, res, await returnService.listMyReturns(req.params.storeId, req.auth && req.auth.userId, req.query)); }
    catch (err) { return next(err); }
};

const createReturn = async (req, res, next) => {
    try { return sendSuccess(req, res, await returnService.createReturn(req.params.storeId, req.validated, actorOf(req)), 201); }
    catch (err) { return next(err); }
};

const updateReturnStatus = async (req, res, next) => {
    try { return sendSuccess(req, res, await returnService.updateReturnStatus(req.params.storeId, req.params.returnId, req.validated.status, req.auth.userId)); }
    catch (err) { return next(err); }
};

module.exports = { listReturns, listMyReturns, createReturn, updateReturnStatus };
