'use strict';
const router = require('express').Router();
router.use('/notifications', require('./notificationRoutes'));
router.use('/public', require('./publicRoutes'));
module.exports = router;
