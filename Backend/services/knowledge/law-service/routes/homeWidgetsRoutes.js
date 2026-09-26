'use strict';
const router = require('express').Router();
const ctrl = require('../controller/homeWidgetsController');

// Public, unauthenticated read of live, published entries only.
router.get('/', ctrl.listLive);

module.exports = router;
