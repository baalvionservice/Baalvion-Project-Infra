'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/subscriptionController');

router.get('/plans',   ctrl.getPlans); // public — plan catalog for display
router.get('/',        authMiddleware, ctrl.getSubscription);
router.post('/',       authMiddleware, ctrl.createSubscription);
router.post('/cancel', authMiddleware, ctrl.cancelSubscription);

module.exports = router;
