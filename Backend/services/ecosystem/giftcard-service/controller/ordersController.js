'use strict';
const giftcardService = require('../service/giftcardService');
const { sendSuccess } = require('../utils/response');
const { decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');
const { checkoutSchema } = require('../validators/schemas');

const checkout = async (req, res, next) => {
    try {
        const parsed = checkoutSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const email = decodeEmailFromRequest(req);
        const result = await giftcardService.checkout(
            req.params.slug, req.auth.userId, email, parsed.data.denomination, parsed.data.asset
        );
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

const listMyOrders = async (req, res, next) => {
    try {
        const data = await giftcardService.listMyOrders(req.auth.userId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { checkout, listMyOrders };
