'use strict';
const { sendSuccess } = require('../utils/response');
const cartService = require('../service/cartService');

const getCart = async (req, res, next) => {
    try { return sendSuccess(req, res, await cartService.getCart(req.params.storeId, req.params.cartId)); }
    catch (err) { return next(err); }
};

const createCart = async (req, res, next) => {
    try { return sendSuccess(req, res, await cartService.createCart(req.params.storeId, { ...req.validated, userId: req.auth?.userId }), 201); }
    catch (err) { return next(err); }
};

const addItem = async (req, res, next) => {
    try { return sendSuccess(req, res, await cartService.addItem(req.params.storeId, req.params.cartId, req.validated)); }
    catch (err) { return next(err); }
};

const updateItem = async (req, res, next) => {
    try { return sendSuccess(req, res, await cartService.updateItem(req.params.storeId, req.params.cartId, req.validated.variantId, req.validated.productId, req.validated.quantity)); }
    catch (err) { return next(err); }
};

const removeItem = async (req, res, next) => {
    try { await cartService.removeItem(req.params.storeId, req.params.cartId, req.query.variantId, req.query.productId); return sendSuccess(req, res, null, 204); }
    catch (err) { return next(err); }
};

const clearCart = async (req, res, next) => {
    try { await cartService.clearCart(req.params.storeId, req.params.cartId); return sendSuccess(req, res, null, 204); }
    catch (err) { return next(err); }
};

module.exports = { getCart, createCart, addItem, updateItem, removeItem, clearCart };
