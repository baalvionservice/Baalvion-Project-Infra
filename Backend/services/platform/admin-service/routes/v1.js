'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Public, token-authenticated invitation acceptance (must precede authMiddleware).
// Unmatched /staff paths fall through to the authenticated staff router below.
router.use('/staff', require('./staffPublicRoutes'));

router.use(authMiddleware);
router.use('/admin', require('./adminRoutes'));
router.use('/identity', require('./identityRoutes'));
router.use('/staff', require('./staffRoutes'));

module.exports = router;
