'use strict';
const { OrdersCart } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const ownership = require('./ownership');
const sessionToken = require('../utils/sessionToken');
const securityAudit = require('./securityAudit');

// API-boundary view of a cart: the raw sessionId is kept SERVER-SIDE for ownership (and in the
// cache) but is NEVER returned in a response — the client only ever holds the signed token.
const present = (data) => { if (!data) return data; const { sessionId, ...rest } = data; return rest; };

// A cart is owned by the authenticated user who created it (OrdersCart.userId) OR, for a guest
// cart, by the holder of the signed session bound to it (OrdersCart.sessionId). Every read/mutate
// enforces owner-OR-guestSession-OR-staff before returning or changing data.
async function loadOwnedCart(storeId, cartId, actor, action) {
    const cart = await OrdersCart.findOne({ where: { id: cartId, storeId } });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
    await ownership.enforce(actor, cart.userId, { resourceType: 'cart', resourceId: cartId, storeId, action, ownerSessionId: cart.sessionId });
    return cart;
}

async function getCart(storeId, cartId, actor) {
    const cached = await cache.get(cache.keys.cart(cartId));
    if (cached && cached.storeId === storeId) {
        // Ownership uses the cached sessionId (server-side); the response strips it.
        await ownership.enforce(actor, cached.userId, { resourceType: 'cart', resourceId: cartId, storeId, action: 'cart.read', ownerSessionId: cached.sessionId });
        return present(cached);
    }
    const cart = await loadOwnedCart(storeId, cartId, actor, 'cart.read');
    const data = cart.toJSON();
    await cache.set(cache.keys.cart(cartId), data, config.cache.cartTtl); // cache WITH sessionId (ownership re-check)
    return present(data);
}

// Authenticated → cart bound to userId. Guest (no userId) → cart bound to a server-generated,
// HMAC-signed session; the signed token is returned for the client to present on later requests.
async function createCart(storeId, { userId, customerId, currencyCode = 'USD' }) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days
    let sessionId = null;
    let sessionTokenValue = null;
    if (userId == null) {
        sessionId = sessionToken.newSessionId();      // not the cartId, not guessable
        sessionTokenValue = sessionToken.sign(sessionId); // throws 503 if guest sessions are disabled
    }
    const cart = await OrdersCart.create({ storeId, userId: userId ?? null, customerId, sessionId, currencyCode, items: [], subtotal: 0, discountAmount: 0, totalAmount: 0, expiresAt });
    const data = cart.toJSON();
    delete data.sessionId; // never expose the raw session id; only the signed token
    return sessionTokenValue ? { ...data, sessionToken: sessionTokenValue } : data;
}

async function addItem(storeId, cartId, item, actor) {
    const cart = await loadOwnedCart(storeId, cartId, actor, 'cart.update');
    const items = cart.items ? [...cart.items] : [];
    const existing = items.findIndex(i => i.variantId === item.variantId || (i.productId === item.productId && !i.variantId));
    if (existing >= 0) items[existing].quantity += item.quantity;
    else items.push({ productId: item.productId, variantId: item.variantId || null, sku: item.sku, name: item.name, price: item.price, quantity: item.quantity, metadata: item.metadata || {} });
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.update({ items, subtotal, totalAmount: subtotal - parseFloat(cart.discountAmount || 0) });
    await cache.del(cache.keys.cart(cartId));
    return present(cart.toJSON());
}

async function updateItem(storeId, cartId, variantId, productId, quantity, actor) {
    const cart = await loadOwnedCart(storeId, cartId, actor, 'cart.update');
    let items = cart.items ? [...cart.items] : [];
    items = items.map(i => {
        if (variantId ? i.variantId === variantId : i.productId === productId) return { ...i, quantity };
        return i;
    }).filter(i => i.quantity > 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.update({ items, subtotal, totalAmount: subtotal - parseFloat(cart.discountAmount || 0) });
    await cache.del(cache.keys.cart(cartId));
    return present(cart.toJSON());
}

async function removeItem(storeId, cartId, variantId, productId, actor) {
    const cart = await loadOwnedCart(storeId, cartId, actor, 'cart.update');
    const items = (cart.items || []).filter(i => variantId ? i.variantId !== variantId : i.productId !== productId);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.update({ items, subtotal, totalAmount: subtotal - parseFloat(cart.discountAmount || 0) });
    await cache.del(cache.keys.cart(cartId));
    return present(cart.toJSON());
}

async function clearCart(storeId, cartId, actor) {
    const cart = await loadOwnedCart(storeId, cartId, actor, 'cart.update');
    await cart.update({ items: [], subtotal: 0, discountAmount: 0, totalAmount: 0, discountCode: null });
    await cache.del(cache.keys.cart(cartId));
}

// Claim-on-login: an authenticated user adopts a guest cart they own (proven by the signed
// session). The guest cart is merged into the customer's identity (userId set, sessionId cleared)
// only after the session proof matches — no ownership bypass. Items can optionally be merged into
// the caller's existing target cart.
async function claimCart(storeId, cartId, actor, targetCartId) {
    if (!actor || actor.userId == null) throw new AppError('UNAUTHORIZED', 'Authentication required to claim a cart', 401);
    const cart = await OrdersCart.findOne({ where: { id: cartId, storeId } });
    if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);

    // Already user-owned → only the owner (or staff) may "claim" (no-op). Re-uses ownership.
    if (cart.userId != null) {
        await ownership.enforce(actor, cart.userId, { resourceType: 'cart', resourceId: cartId, storeId, action: 'cart.claim' });
        return present(cart.toJSON());
    }

    // Guest cart → require a valid signed session matching the cart's bound session.
    if (!ownership.isSessionOwner(cart.sessionId, actor)) {
        securityAudit.cart('claim_denied', 'deny', { userId: actor.userId, storeId, resource: { type: 'cart', id: cartId }, reason: 'session_mismatch', requestId: actor.requestId });
        throw new AppError('FORBIDDEN', 'You do not have access to this cart', 403);
    }

    // Optional safe merge into the caller's own existing cart.
    if (targetCartId && targetCartId !== cartId) {
        const target = await OrdersCart.findOne({ where: { id: targetCartId, storeId } });
        if (!target) throw new AppError('NOT_FOUND', 'Target cart not found', 404);
        await ownership.enforce(actor, target.userId, { resourceType: 'cart', resourceId: targetCartId, storeId, action: 'cart.claim' });
        const merged = mergeItems(target.items || [], cart.items || []);
        const subtotal = merged.reduce((s, i) => s + i.price * i.quantity, 0);
        await target.update({ items: merged, subtotal, totalAmount: subtotal - parseFloat(target.discountAmount || 0) });
        await cart.destroy();
        await cache.del(cache.keys.cart(cartId));
        await cache.del(cache.keys.cart(targetCartId));
        securityAudit.cart('claimed', 'allow', { userId: actor.userId, storeId, resource: { type: 'cart', id: targetCartId }, requestId: actor.requestId, metadata: { mergedFrom: cartId } });
        return present(target.toJSON());
    }

    // Adopt: reassign the guest cart to the authenticated user, clearing the session binding.
    await cart.update({ userId: actor.userId, sessionId: null });
    await cache.del(cache.keys.cart(cartId));
    securityAudit.cart('claimed', 'allow', { userId: actor.userId, storeId, resource: { type: 'cart', id: cartId }, requestId: actor.requestId });
    return present(cart.toJSON());
}

function mergeItems(base, incoming) {
    const items = base.map((i) => ({ ...i }));
    for (const it of incoming) {
        const idx = items.findIndex((i) => i.variantId === it.variantId || (i.productId === it.productId && !i.variantId));
        if (idx >= 0) items[idx].quantity += it.quantity;
        else items.push({ ...it });
    }
    return items;
}

module.exports = { getCart, createCart, addItem, updateItem, removeItem, clearCart, claimCart };
