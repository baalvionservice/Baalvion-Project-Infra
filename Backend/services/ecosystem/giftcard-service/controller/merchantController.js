'use strict';
const giftcardService = require('../service/giftcardService');
const { sendSuccess } = require('../utils/response');

// Platform-admin only — see routes/adminRoutes.js. Repurposes the merchant/seller surface into
// a real view of the giftcard-service business (orders, revenue, synced catalog) rather than a
// separate multi-vendor marketplace, since Reloadly is the sole supplier behind this catalog.
const listOrders = async (req, res, next) => {
    try {
        const data = await giftcardService.listOrdersAdmin({
            status: req.query.status,
            limit: req.query.limit,
            offset: req.query.offset,
        });
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const getStats = async (req, res, next) => {
    try {
        const data = await giftcardService.getMerchantStats();
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const listCatalogAdmin = async (req, res, next) => {
    try {
        const data = await giftcardService.listCatalogAdmin();
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { listOrders, getStats, listCatalogAdmin };
