'use strict';
const router = require('express').Router();
const internalAuth = require('../middleware/internalAuth');
const entitlementInternalController = require('../controller/entitlementInternalController');
const knowledgeFeedController = require('../controller/knowledgeFeedController');
const { optionalAuth } = require('../middleware/authMiddleware');

// INTERNAL — other services (cms-service's premium-content gate) resolve a caller's
// subscription here. Gated by the shared internal secret, mirrors cms-service's own
// /internal/* resolvers (see routes/v1.js there — integrations, market-data, entity-mentions).
router.get('/internal/entitlements/:userId', internalAuth, entitlementInternalController.getUserEntitlement);

// "Global Data Package" bulk API prototype — merges this service's articles with cms-service's
// content stream. optionalAuth so the controller can tell an anonymous caller apart from a
// logged-in one without a subscription (both get the same 403, but with req.auth populated when
// present the license check can actually run instead of always short-circuiting to "no license").
router.get('/knowledge-feed', optionalAuth, knowledgeFeedController.getKnowledgeFeed);

router.use('/articles', require('./articlesRoutes'));
router.use('/entities', require('./entitiesRoutes'));
// Duplicate mount of the same (already-public-read) entities router under
// /public/entities — mirrors cms-service's dedicated /public delivery
// namespace. The gateway namespace for this service (/api/v1/knowledge/
// imperialpedia) has been observed gating ALL paths, including /health,
// behind auth in production despite carrying no auth middleware here or in
// the gateway's own checked-in config — likely drift or a missing edge rule.
// This route needs its own explicit public-delivery gateway rule (see
// cms-service's /api/v1/public/:websiteSlug pattern) once that's resolved;
// the write endpoints on entitiesRoutes stay protected by their own
// authMiddleware regardless of which prefix reaches them.
router.use('/public/entities', require('./entitiesRoutes'));
router.use('/search', require('./searchRoutes'));
router.use('/assets', require('./assetsRoutes'));
router.use('/market-data', require('./marketSyncRoutes'));
router.use('/community', require('./communityRoutes'));
router.use('/creators', require('./creatorsRoutes'));
router.use('/leaderboard', require('./leaderboardRoutes'));
router.use('/calculators', require('./calculatorRoutes'));
router.use('/analytics', require('./analyticsRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/portfolio', require('./portfolioRoutes'));
router.use('/glossary', require('./glossaryRoutes'));
router.use('/world-config', require('./worldConfigRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/affiliate-products', require('./affiliateRoutes'));
router.use('/newsletter', require('./newsletterRoutes'));
module.exports = router;
