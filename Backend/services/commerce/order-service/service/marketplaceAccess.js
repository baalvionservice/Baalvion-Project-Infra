'use strict';

// On the shared marketplace store every approved seller holds a store role, and the capability
// ladder puts that above store_viewer/ops_manager. Without this rule any seller could list, change
// and refund every other seller's orders and read their buyers. So on that store only full
// store-admin capability (or a platform admin) counts as staff; sellers use the scoped
// /seller/orders routes instead. Every other store keeps its normal ladder.
const FULL_ADMIN_LEVEL = 100;

const isMarketplace = (storeId, marketplaceStoreId) => !!storeId && storeId === marketplaceStoreId;
const minStaffLevel = (storeId, marketplaceStoreId) => (isMarketplace(storeId, marketplaceStoreId) ? FULL_ADMIN_LEVEL : 1);
const blocksSellerTier = (storeId, level, marketplaceStoreId) =>
    isMarketplace(storeId, marketplaceStoreId) && (level || 0) < FULL_ADMIN_LEVEL;

module.exports = { FULL_ADMIN_LEVEL, minStaffLevel, blocksSellerTier };
