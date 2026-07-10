'use strict';
const router = require('express').Router();
router.use('/news', require('./newsRoutes'));
router.use('/stats', require('./statsRoutes'));
router.use('/admin', require('./adminRoutes'));
module.exports = router;
