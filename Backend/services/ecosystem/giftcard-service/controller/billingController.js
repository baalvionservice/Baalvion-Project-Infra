'use strict';
const giftcardService = require('../service/giftcardService');
const { AppError } = require('../utils/errors');

// Internal webhook — verified by internalAuth middleware (see routes/billingRoutes.js), not
// the platform gateway/authMiddleware (payment-service is not an end-user, it has no RS256 token).
const fulfill = async (req, res, next) => {
    try {
        const result = await giftcardService.fulfill(req.body || {});
        return res.status(200).json(result);
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
        }
        return next(err);
    }
};

module.exports = { fulfill };
