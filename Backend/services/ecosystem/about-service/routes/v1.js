'use strict';
const router = require('express').Router();

router.use('/pages', require('./pages'));
router.use('/team', require('./team'));
router.use('/news', require('./news'));
router.use('/faqs', require('./faqs'));
router.use('/contact', require('./contact'));

module.exports = router;
