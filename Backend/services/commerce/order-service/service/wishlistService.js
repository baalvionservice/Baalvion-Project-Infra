'use strict';
// Wishlist persistence for the authenticated shopper. The owner is ALWAYS the JWT userId — never a
// client-supplied id (IDOR-safe). A wishlist is auto-created on first access. Items are deduplicated
// by (wishlist, product, variant) via the DB partial uniques + a pre-check here.
const { Op } = require('sequelize');
const { Wishlist, WishlistItem, sequelize } = require('../models');
const { AppError } = require('../utils/errors');

async function ensureWishlist(storeId, userId, t) {
    if (userId == null) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    const [wishlist] = await Wishlist.findOrCreate({ where: { storeId, userId }, defaults: { storeId, userId }, transaction: t });
    return wishlist;
}

async function loadWishlist(wishlist) {
    const items = await WishlistItem.findAll({ where: { wishlistId: wishlist.id }, order: [['createdAt', 'ASC']] });
    return { ...wishlist.toJSON(), items: items.map((i) => i.toJSON()) };
}

async function getMyWishlist(storeId, userId) {
    const wishlist = await ensureWishlist(storeId, userId);
    return loadWishlist(wishlist);
}

async function addItem(storeId, userId, body) {
    const productId = body.productId;
    const variantId = body.variantId || null;
    return sequelize.transaction(async (t) => {
        const wishlist = await ensureWishlist(storeId, userId, t);
        // Dedup pre-check (the partial uniques are the authoritative guard). A NULL variant must be
        // matched with IS NULL, so branch the where on variant presence.
        const where = { wishlistId: wishlist.id, productId, variantId: variantId === null ? { [Op.is]: null } : variantId };
        const existing = await WishlistItem.findOne({ where, transaction: t });
        if (!existing) {
            await WishlistItem.create({ wishlistId: wishlist.id, productId, variantId, addedAt: new Date() }, { transaction: t });
        }
        const items = await WishlistItem.findAll({ where: { wishlistId: wishlist.id }, order: [['createdAt', 'ASC']], transaction: t });
        return { ...wishlist.toJSON(), items: items.map((i) => i.toJSON()) };
    });
}

async function removeItem(storeId, userId, productId, variantId) {
    if (userId == null) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    const wishlist = await Wishlist.findOne({ where: { storeId, userId } });
    if (!wishlist) return { items: [] }; // no wishlist → nothing to remove (idempotent)
    const where = { wishlistId: wishlist.id, productId };
    // variantId undefined → remove all rows for the product; explicit (incl. null) → match exactly.
    if (variantId !== undefined) where.variantId = variantId === null ? { [Op.is]: null } : variantId;
    await WishlistItem.destroy({ where });
    return loadWishlist(wishlist);
}

module.exports = { getMyWishlist, addItem, removeItem };
