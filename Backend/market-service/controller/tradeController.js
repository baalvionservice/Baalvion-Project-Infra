'use strict';
const tradeService = require('../service/tradeService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createTradeSchema, paginationSchema } = require('../validators/schemas');

const listTrades = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await tradeService.listTrades(req.user.id, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createTrade = async (req, res, next) => {
    try {
        const parsed = createTradeSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await tradeService.createTrade(req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getTrade = async (req, res, next) => {
    try {
        const data = await tradeService.getTrade(req.params.id, req.user.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { listTrades, createTrade, getTrade };
