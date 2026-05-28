'use strict';
const { OrdersCart } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');

async function getCart(storeId, cartId) {
    const cached = await cache.get(cache.keys.cart(cartId));
    if (cached && cached.storeId === storeId) return cached;
    const cart = await OrdersCart.findOne({ where: { id: cartId, storeId } });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
    const data = cart.toJSON();
    await cache.set(cache.keys.cart(cartId), data, config.cache.cartTtl);
    return data;
}

async function createCart(storeId, { userId, customerId, sessionId, currencyCode = 'USD' }) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days
    const cart = await OrdersCart.create({ storeId, userId, customerId, sessionId, currencyCode, items: [], subtotal: 0, discountAmount: 0, totalAmount: 0, expiresAt });
    return cart.toJSON();
}

async function addItem(storeId, cartId, item) {
    const cart = await OrdersCart.findOne({ where: { id: cartId, storeId } });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
    const items = cart.items ? [...cart.items] : [];
    const existing = items.findIndex(i => i.variantId === item.variantId || (i.productId === item.productId && !i.variantId));
    if (existing >= 0) items[existing].quantity += item.quantity;
    else items.push({ productId: item.productId, variantId: item.variantId || null, sku: item.sku, name: item.name, price: item.price, quantity: item.quantity, metadata: item.metadata || {} });
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.update({ items, subtotal, totalAmount: subtotal - parseFloat(cart.discountAmount || 0) });
    await cache.del(cache.keys.cart(cartId));
    return cart.toJSON();
}

async function updateItem(storeId, cartId, variantId, productId, quantity) {
    const cart = await OrdersCart.findOne({ where: { id: cartId, storeId } });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
    let items = cart.items ? [...cart.items] : [];
    items = items.map(i => {
        if (variantId ? i.variantId === variantId : i.productId === productId) return { ...i, quantity };
        return i;
    }).filter(i => i.quantity > 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.update({ items, subtotal, totalAmount: subtotal - parseFloat(cart.discountAmount || 0) });
    await cache.del(cache.keys.cart(cartId));
    return cart.toJSON();
}

async function removeItem(storeId, cartId, variantId, productId) {
    const cart = await OrdersCart.findOne({ where: { id: cartId, storeId } });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
    const items = (cart.items || []).filter(i => variantId ? i.variantId !== variantId : i.productId !== productId);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.update({ items, subtotal, totalAmount: subtotal - parseFloat(cart.discountAmount || 0) });
    await cache.del(cache.keys.cart(cartId));
    return cart.toJSON();
}

async function clearCart(storeId, cartId) {
    const cart = await OrdersCart.findOne({ where: { id: cartId, storeId } });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
    await cart.update({ items: [], subtotal: 0, discountAmount: 0, totalAmount: 0, discountCode: null });
    await cache.del(cache.keys.cart(cartId));
}

module.exports = { getCart, createCart, addItem, updateItem, removeItem, clearCart };
