'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/referralController');

router.get('/my-code',  authMiddleware, ctrl.getMyCode);
router.post('/apply',   authMiddleware, ctrl.applyReferral);
router.get('/stats',    authMiddleware, ctrl.getReferralStats);

module.exports = router;
