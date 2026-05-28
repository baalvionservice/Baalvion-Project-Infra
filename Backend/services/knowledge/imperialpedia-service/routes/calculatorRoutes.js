'use strict';
const router = require('express').Router();
const ctrl = require('../controller/calculatorController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/compound-interest', ctrl.compoundInterest);
router.post('/retirement', ctrl.retirement);
router.post('/loan', ctrl.loan);
router.post('/sip', ctrl.sip);
router.get('/history', authMiddleware, ctrl.getHistory);

module.exports = router;
