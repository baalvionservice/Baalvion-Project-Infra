'use strict';
const router = require('express').Router();
const ctrl = require('../controller/searchController');

router.get('/', ctrl.search);

module.exports = router;
