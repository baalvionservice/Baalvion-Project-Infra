'use strict';
const db = require('../models');
const billingService = require('../service/billingService');
const { sendSuccess } = require('../utils/response');
const { decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');
const { z } = require('zod');

const checkoutSchema = z.object({ asset: z.enum(['USDT_TRC20', 'ETH_BEP20', 'BTC']) });

const checkout = async (req, res, next) => {
    try {
        const parsed = checkoutSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await db.Community.findOne({ where: { slug: req.params.slug, is_active: true } });
        if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);
        const email = decodeEmailFromRequest(req);
        const result = await billingService.checkout(community, req.auth.userId, email, parsed.data.asset);
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

// Internal webhook — verified by internalAuth middleware (see routes/billingRoutes.js), not
// the platform gateway/authMiddleware (payment-service is not an end-user, it has no RS256 token).
const fulfill = async (req, res, next) => {
    try {
        const result = await billingService.fulfill(req.body || {});
        return res.status(200).json(result);
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
        }
        return next(err);
    }
};

module.exports = { checkout, fulfill };
