'use strict';
const router = require('express').Router();
router.use('/', require('./graphRoutes'));
module.exports = router;
