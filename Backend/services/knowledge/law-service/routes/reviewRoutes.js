'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/reviewController');

router.get('/',  ctrl.listReviews);
router.post('/', authMiddleware, ctrl.createReview);
router.post('/case-referral', authMiddleware, ctrl.createCaseReferralReview);

module.exports = router;
