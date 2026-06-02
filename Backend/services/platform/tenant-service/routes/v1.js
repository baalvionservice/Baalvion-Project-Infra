'use strict';
const express = require('express');
const router = express.Router();

router.use('/', require('./tenantRoutes'));

module.exports = router;
