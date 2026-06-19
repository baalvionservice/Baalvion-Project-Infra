'use strict';
const { sendSuccess } = require('../utils/response');
const wishlistService = require('../service/wishlistService');

// The authenticated shopper's wishlist (auto-created). Owner resolved server-side from req.auth.userId.
const getMyWishlist = async (req, res, next) => {
    try { return sendSuccess(req, res, await wishlistService.getMyWishlist(req.params.storeId, req.auth && req.auth.userId)); }
    catch (err) { return next(err); }
};

const addItem = async (req, res, next) => {
    try { return sendSuccess(req, res, await wishlistService.addItem(req.params.storeId, req.auth && req.auth.userId, req.validated), 201); }
    catch (err) { return next(err); }
};

// variantId is an optional query param ('' / absent → remove all rows for the product).
const removeItem = async (req, res, next) => {
    try {
        const variantId = req.query.variantId !== undefined ? (req.query.variantId || null) : undefined;
        return sendSuccess(req, res, await wishlistService.removeItem(req.params.storeId, req.auth && req.auth.userId, req.params.productId, variantId));
    } catch (err) { return next(err); }
};

module.exports = { getMyWishlist, addItem, removeItem };
