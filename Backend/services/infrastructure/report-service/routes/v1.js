'use strict';
const express = require('express');
const router = express.Router();

router.use('/', require('./reportRoutes'));

module.exports = router;
