'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Public, token-authenticated invitation acceptance (must precede authMiddleware).
// Unmatched /staff paths fall through to the authenticated staff router below.
router.use('/staff', require('./staffPublicRoutes'));

router.use(authMiddleware);
// Phase 2 modules. The specific /admin/* prefixes MUST be registered BEFORE the generic
// /admin mount, otherwise Express routes /admin/feature-flags|analytics into adminRoutes
// (which lacks them) and 404s.
router.use('/admin/feature-flags', require('./featureFlagsRoutes'));
router.use('/admin/analytics', require('./analyticsRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/support', require('./supportRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/developer', require('./developerRoutes'));
router.use('/identity', require('./identityRoutes'));
router.use('/staff', require('./staffRoutes'));

module.exports = router;
