'use strict';
// PUBLIC storefront routes (no auth) — read-only access to published, public catalog, plus an
// anonymous promo-code PREVIEW. Mounted in v1.js WITHOUT authMiddleware. Writes/admin remain on
// the authed routes; final discount application stays server-authoritative in order-service.
const express = require('express');
const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controller/storefrontController');
const { validate } = require('../middleware/validate');
const { previewDiscountSchema } = require('../validators/discountSchemas');
const { heartbeatSchema } = require('../validators/presenceSchemas');

const router = Router({ mergeParams: true });

// This router is mounted in index.js BEFORE the app-level express.json(), so it needs its own
// body parser or every POST here (discount preview, presence heartbeat) sees req.body===undefined.
// Small cap — storefront POST bodies are tiny ({ code, orderAmount } / { visitorId }).
router.use(express.json({ limit: '16kb' }));

// Tighter limiter for the discount preview: code-probing is a brute-force vector, so cap it well
// below the generous global storefront read limit. Env-overridable, safe non-prod default.
const discountPreviewLimit = rateLimit({
    windowMs: 60_000,
    max: Number(process.env.STOREFRONT_DISCOUNT_RL_MAX || 8),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many discount checks, please slow down' } },
});

// Presence beacon limiter: heartbeats are frequent BY DESIGN (~1 per visitor every 25s) and many
// legitimate visitors can share one NAT IP, so this cap is generous — it only stops egregious
// floods. Env-overridable. Read-only count is cheap and shares the same allowance.
const presenceLimit = rateLimit({
    windowMs: 60_000,
    max: Number(process.env.STOREFRONT_PRESENCE_RL_MAX || 600),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many presence pings' } },
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

// Live presence: anonymous heartbeat (storefront beacon) + read-only count (admin dashboard poll).
router.post('/presence/heartbeat', presenceLimit, validate(heartbeatSchema), ctrl.presenceHeartbeat);
router.get('/presence/count', presenceLimit, ctrl.presenceCount);

module.exports = router;
