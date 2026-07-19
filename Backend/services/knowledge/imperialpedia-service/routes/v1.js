'use strict';
const router = require('express').Router();
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
module.exports = router;
