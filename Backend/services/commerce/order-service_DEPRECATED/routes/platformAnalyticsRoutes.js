'use strict';
// Platform-scoped order analytics — CROSS-STORE aggregates that are NOT keyed by a single store.
// Mounted at /orders/analytics (NOT under /stores/:storeId). Gated by authMiddleware +
// requirePlatformAdmin (super_admin | country_admin) — the store-scoped PEP is the wrong authority
// for an all-stores query (it 403s without a per-store role). A store_viewer/guest token is denied.
const { Router } = require('express');
const ctrl = require('../controller/analyticsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePlatformAdmin } = require('../middleware/rbacPep');

const router = Router({ mergeParams: true });

// GET /orders/analytics/revenue?from&to&granularity=day|week|month&storeId=...
// → { totals, byMarket[], byStatus[], series[] } (C2 contract). Earned, currency-normalized.
router.get('/revenue', authMiddleware, requirePlatformAdmin, ctrl.platformRevenue);

module.exports = router;
