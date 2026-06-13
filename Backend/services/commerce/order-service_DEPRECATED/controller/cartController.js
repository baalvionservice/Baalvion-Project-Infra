'use strict';
const { sendSuccess } = require('../utils/response');
const cartService = require('../service/cartService');
const { actorOf } = require('../utils/actor');

const getCart = async (req, res, next) => {
    try { return sendSuccess(req, res, await cartService.getCart(req.params.storeId, req.params.cartId, actorOf(req))); }
    catch (err) { return next(err); }
};

const createCart = async (req, res, next) => {
    // Authenticated → bound to userId; guest → response includes a signed `sessionToken`.
    try { return sendSuccess(req, res, await cartService.createCart(req.params.storeId, { currencyCode: req.validated.currencyCode, customerId: req.validated.customerId, userId: req.auth?.userId }), 201); }
    catch (err) { return next(err); }
};

const addItem = async (req, res, next) => {
    try { return sendSuccess(req, res, await cartService.addItem(req.params.storeId, req.params.cartId, req.validated, actorOf(req))); }
    catch (err) { return next(err); }
};

const updateItem = async (req, res, next) => {
    try { return sendSuccess(req, res, await cartService.updateItem(req.params.storeId, req.params.cartId, req.validated.variantId, req.validated.productId, req.validated.quantity, actorOf(req))); }
    catch (err) { return next(err); }
};

const removeItem = async (req, res, next) => {
    try { await cartService.removeItem(req.params.storeId, req.params.cartId, req.query.variantId, req.query.productId, actorOf(req)); return sendSuccess(req, res, null, 204); }
    catch (err) { return next(err); }
};

const clearCart = async (req, res, next) => {
    try { await cartService.clearCart(req.params.storeId, req.params.cartId, actorOf(req)); return sendSuccess(req, res, null, 204); }
    catch (err) { return next(err); }
};

// Claim-on-login: authenticated user adopts/merges a guest cart they prove ownership of (signed
// X-Cart-Session). Optional body.targetCartId merges items into the caller's existing cart.
const claimCart = async (req, res, next) => {
    try { return sendSuccess(req, res, await cartService.claimCart(req.params.storeId, req.params.cartId, actorOf(req), req.body && req.body.targetCartId)); }
    catch (err) { return next(err); }
};

module.exports = { getCart, createCart, addItem, updateItem, removeItem, clearCart, claimCart };
