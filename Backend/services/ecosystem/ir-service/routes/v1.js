'use strict';
const router = require('express').Router();

router.use('/reports', require('./reports'));
router.use('/filings', require('./filings'));
router.use('/documents', require('./documents'));
router.use('/earnings', require('./earnings'));
router.use('/shareholders', require('./shareholders'));
router.use('/contacts', require('./contacts'));

module.exports = router;
