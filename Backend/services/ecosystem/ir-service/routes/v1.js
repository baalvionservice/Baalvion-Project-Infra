'use strict';
const router = require('express').Router();

router.use('/reports', require('./reports'));
router.use('/filings', require('./filings'));
router.use('/documents', require('./documents'));
router.use('/earnings', require('./earnings'));
router.use('/shareholders', require('./shareholders'));
router.use('/events', require('./events'));
router.use('/contacts', require('./contacts'));
router.use('/notifications', require('./notifications'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/votes', require('./votes'));
router.use('/settings', require('./settings'));
router.use('/alerts', require('./alerts'));
router.use('/board-materials', require('./boardMaterials'));
router.use('/generated-reports', require('./generatedReports'));
router.use('/performance', require('./performance'));
router.use('/market', require('./market'));
router.use('/applications', require('./applications'));

module.exports = router;
