'use strict';
const router = require('express').Router();
const ctrl = require('../controller/practiceAreaController');

router.get('/', ctrl.listPracticeAreas);

module.exports = router;
