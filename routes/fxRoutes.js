'use strict';
const router = require('express').Router();
const { getRate, convert } = require('../controller/fxController');

router.get('/rates',   getRate);
router.get('/convert', convert);

module.exports = router;
