'use strict';
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

// On the shared marketplace store every approved seller holds a store role (product_manager), and
// the capability ladder puts that above store_viewer/content_editor/commerce_manager. Without these
// guards a seller could read every other seller's drafts, bulk-archive their listings, edit
// store-wide discount codes and categories, or approve reviews. Only full store-admin capability
// (or a platform admin) is "the platform" there; everyone else is a seller and sees only their own.
// Other stores keep their normal behaviour.
const FULL_ADMIN_LEVEL = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isMarketplaceSeller = (req) =>
    !!req.params && !!config.marketplace.defaultStoreId
    && req.params.storeId === config.marketplace.defaultStoreId
    && (req.storeLevel || 0) < FULL_ADMIN_LEVEL;

// Platform-only: discounts, collections, category edits, team list.
const adminOnlyOnMarketplace = (req, res, next) =>
    (isMarketplaceSeller(req) ? next(new AppError('FORBIDDEN', 'This is managed by the marketplace, not by sellers', 403)) : next());

// A seller may touch only a product they created. Same answer as "not found" for someone else's,
// so listing ids cannot be probed.
const ownProductOnMarketplace = async (req, res, next) => {
    try {
        if (!isMarketplaceSeller(req)) return next();
        const productId = req.params.productId;
        if (!UUID_RE.test(String(productId))) return next(new AppError('NOT_FOUND', 'Product not found', 404));
        const { CommerceProduct } = require('../models');
        const product = await CommerceProduct.findOne({ where: { id: productId, storeId: req.params.storeId }, attributes: ['id', 'createdBy'] });
        if (!product || !req.auth || String(product.createdBy) !== String(req.auth.userId)) return next(new AppError('NOT_FOUND', 'Product not found', 404));
        return next();
    } catch (err) { return next(err); }
};

// Sellers may reply to reviews of their own products but not approve or reject them.
const sellerCannotModerate = (req, res, next) =>
    (isMarketplaceSeller(req) && req.body && req.body.status !== undefined
        ? next(new AppError('FORBIDDEN', 'Only the marketplace can approve or reject reviews', 403))
        : next());

module.exports = { FULL_ADMIN_LEVEL, isMarketplaceSeller, adminOnlyOnMarketplace, ownProductOnMarketplace, sellerCannotModerate };
