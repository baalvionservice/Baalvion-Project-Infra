'use strict';
const { sendPaginated } = require('../utils/response');
const adminCartService = require('../service/adminCartService');

const listLiveCarts = async (req, res, next) => {
    try {
        const result = await adminCartService.listLiveCarts(req.validatedQuery || {});
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const listAbandonedCarts = async (req, res, next) => {
    try {
        const result = await adminCartService.listAbandonedCarts(req.validatedQuery || {});
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getCartHistory = async (req, res, next) => {
    try {
        const result = await adminCartService.getCartHistory(req.params.userId, req.validatedQuery || {});
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { listLiveCarts, listAbandonedCarts, getCartHistory };
