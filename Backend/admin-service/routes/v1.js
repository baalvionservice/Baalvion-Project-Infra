'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use('/admin', require('./adminRoutes'));

module.exports = router;
