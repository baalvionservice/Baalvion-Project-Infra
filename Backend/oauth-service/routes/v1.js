'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');

router.use('/clients', authMiddleware, require('./clientRoutes'));

module.exports = router;
