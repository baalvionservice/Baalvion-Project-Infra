'use strict';
const providers = require('../providers');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const getRate = async (req, res, next) => {
    try {
        const { base, target } = req.query;
        if (!base || !target) return next(new AppError('BAD_REQUEST', 'base and target are required', 400));
        const quote = await providers.fx.getRate(base, target);
        return sendSuccess(req, res, quote);
    } catch (err) {
        return next(err);
    }
};

const convert = async (req, res, next) => {
    try {
        const { base, target, amount } = req.query;
        if (!base || !target || amount == null) return next(new AppError('BAD_REQUEST', 'base, target and amount are required', 400));
        const result = await providers.fx.convert(base, target, amount);
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getRate, convert };
