'use strict';
const router = require('express').Router();
router.use('/notifications', require('./notificationRoutes'));
module.exports = router;
