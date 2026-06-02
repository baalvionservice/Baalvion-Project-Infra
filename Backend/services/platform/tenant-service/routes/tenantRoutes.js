'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/tenantController');
const asyncHandler = require('../utils/asyncHandler');
const { internalOrUser } = require('../middleware/authMiddleware');
const { requireTenantAdmin } = require('../middleware/guards');

const router = express.Router();

// Rate-limit the unauthenticated /resolve endpoint: 120 req / min per IP.
// Generous enough for real login-page loads; blocks scraping / DNS-enumeration.
const resolveRateLimit = rateLimit({
    windowMs: 60_000,
    max: Number(process.env.RESOLVE_RATE_LIMIT_MAX) || 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

// ── public: resolve branding by domain (no auth — every login page calls this) ──
router.get('/resolve', resolveRateLimit, asyncHandler(ctrl.resolve));

// ── everything below requires a tenant-admin role (or X-Internal-Key) ──
router.use(internalOrUser, requireTenantAdmin);

// tenants
router.post('/tenants',             asyncHandler(ctrl.create));
router.post('/tenants/provision',   asyncHandler(ctrl.provision));
router.get('/tenants',              asyncHandler(ctrl.list));
router.get('/tenants/:id',          asyncHandler(ctrl.get));
router.patch('/tenants/:id',        asyncHandler(ctrl.update));
router.post('/tenants/:id/status',  asyncHandler(ctrl.setStatus));
router.delete('/tenants/:id',       asyncHandler(ctrl.remove));

// branding
router.get('/tenants/:id/branding',  asyncHandler(ctrl.getBranding));
router.put('/tenants/:id/branding',  asyncHandler(ctrl.upsertBranding));

// domains
router.get('/tenants/:id/domains',                       asyncHandler(ctrl.listDomains));
router.post('/tenants/:id/domains',                      asyncHandler(ctrl.addDomain));
router.post('/tenants/:id/domains/:domainId/verify',     asyncHandler(ctrl.verifyDomain));
router.post('/tenants/:id/domains/:domainId/primary',    asyncHandler(ctrl.setPrimaryDomain));
router.delete('/tenants/:id/domains/:domainId',          asyncHandler(ctrl.removeDomain));

// entitlements
router.get('/tenants/:id/entitlements',                       asyncHandler(ctrl.listEntitlements));
router.put('/tenants/:id/entitlements',                       asyncHandler(ctrl.setEntitlement));
router.get('/tenants/:id/entitlements/:featureKey/check',     asyncHandler(ctrl.checkEntitlement));
router.post('/tenants/:id/entitlements/:featureKey/consume',  asyncHandler(ctrl.consumeEntitlement));
router.delete('/tenants/:id/entitlements/:featureKey',        asyncHandler(ctrl.removeEntitlement));

module.exports = router;
