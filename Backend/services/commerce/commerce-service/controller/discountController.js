'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const discountService = require('../service/discountService');

const listDiscounts = async (req, res, next) => {
    try {
        const result = await discountService.listDiscounts(req.params.storeId, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const createDiscount = async (req, res, next) => {
    try {
        const discount = await discountService.createDiscount(req.params.storeId, req.validated);
        return sendSuccess(req, res, discount, 201);
    } catch (err) { return next(err); }
};

const updateDiscount = async (req, res, next) => {
    try {
        const discount = await discountService.updateDiscount(req.params.storeId, req.params.discountId, req.validated);
        return sendSuccess(req, res, discount);
    } catch (err) { return next(err); }
};

const deleteDiscount = async (req, res, next) => {
    try {
        await discountService.deleteDiscount(req.params.storeId, req.params.discountId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

const validateDiscount = async (req, res, next) => {
    try {
        const result = await discountService.validateDiscount(req.params.storeId, req.validated.code, req.validated.orderAmount);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { listDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscount };
