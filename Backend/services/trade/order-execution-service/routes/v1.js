'use strict';
const router = require('express').Router();

router.use('/orders', require('./orderRoutes'));
router.use('/internal', require('./internalRoutes'));
router.use('/webhooks', require('./webhookRoutes'));

module.exports = router;
