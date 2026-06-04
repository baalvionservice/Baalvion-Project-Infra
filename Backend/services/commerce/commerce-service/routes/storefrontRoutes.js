'use strict';
// PUBLIC storefront routes (no auth) — read-only access to published, public catalog, plus an
// anonymous promo-code PREVIEW. Mounted in v1.js WITHOUT authMiddleware. Writes/admin remain on
// the authed routes; final discount application stays server-authoritative in order-service.
const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controller/storefrontController');
const { validate } = require('../middleware/validate');
const { previewDiscountSchema } = require('../validators/discountSchemas');

const router = Router({ mergeParams: true });

// Tighter limiter for the discount preview: code-probing is a brute-force vector, so cap it well
// below the generous global storefront read limit. Env-overridable, safe non-prod default.
const discountPreviewLimit = rateLimit({
    windowMs: 60_000,
    max: Number(process.env.STOREFRONT_DISCOUNT_RL_MAX || 8),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many discount checks, please slow down' } },
});

router.get('/products', ctrl.listProducts);
router.get('/products/:idOrSlug/reviews', ctrl.listReviews);
router.get('/products/:idOrSlug/related', ctrl.listRelated);
router.get('/products/:idOrSlug', ctrl.getProduct);
router.get('/departments', ctrl.listDepartments);
router.get('/categories', ctrl.listCategories);
router.get('/collections', ctrl.listCollections);

// Anonymous promo-code preview (no store role). Rate-limited + schema-validated.
router.post('/discounts/validate', discountPreviewLimit, validate(previewDiscountSchema), ctrl.previewDiscount);

module.exports = router;
