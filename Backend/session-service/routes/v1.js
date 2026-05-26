'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');

router.use('/sessions', authMiddleware, require('./sessionRoutes'));

module.exports = router;
