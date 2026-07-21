'use strict';
// Thin re-export — store authorization middleware now lives in @baalvion/commerce-rbac (shared
// by every commerce service). RBAC remains the single source of truth. Route files keep importing
// { loadStoreRole, loadAccessScope, requireStoreRole, STORE_ROLE_LEVEL } from here unchanged.
const { STORE_ROLE_LEVEL } = require('@baalvion/commerce-rbac');
const { pep, requirePlatformAdmin } = require('../service/rbac');
const { AppError } = require('../utils/errors');

// Per-product ownership gate — commerce-rbac's requireStoreRole('content_editor'/'commerce_manager')
// only proves the caller holds AT LEAST that capability somewhere in the store; it says nothing
// about WHICH products they may touch. That was a non-issue when a "store" meant one business's own
// staff, but Market Underworld now grants unrelated independent sellers product_manager on the SAME
// shared store (see sellerApplicationService.approveApplication) — without this, any approved seller
// could edit or delete any OTHER seller's listing (IDOR / broken authorization). A caller at
// store_admin level (100) has full store authority and bypasses this, matching every other
// store-wide admin action in this service.
function requireProductOwner() {
    return async (req, res, next) => {
        try {
            if ((req.storeLevel || 0) >= STORE_ROLE_LEVEL.store_admin) return next();
            const { CommerceProduct } = require('../models');
            const product = await CommerceProduct.findOne({
                where: { id: req.params.productId, storeId: req.params.storeId },
                attributes: ['id', 'createdBy'],
            });
            if (!product) return next(new AppError('NOT_FOUND', 'Product not found', 404));
            if (!req.auth || String(product.createdBy) !== String(req.auth.userId)) {
                return next(new AppError('FORBIDDEN', 'You can only manage your own listings', 403));
            }
            return next();
        } catch (err) { return next(err); }
    };
}

module.exports = {
    loadStoreRole: pep.loadStoreRole,
    loadAccessScope: pep.loadAccessScope,
    requireStoreRole: pep.requireStoreRole,
    requirePlatformAdmin,
    requireProductOwner,
    STORE_ROLE_LEVEL,
};
