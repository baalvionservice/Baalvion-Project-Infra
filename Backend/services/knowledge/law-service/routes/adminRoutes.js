'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/adminController');

router.get('/stats',                 authMiddleware, ctrl.getDashboardStats);
router.get('/analytics',             authMiddleware, ctrl.getAnalytics);
router.get('/users',                 authMiddleware, ctrl.listAllUsers);
router.get('/lawyers/pending',       authMiddleware, ctrl.getPendingLawyers);
router.patch('/lawyers/:id/suspend', authMiddleware, ctrl.suspendLawyer);

module.exports = router;
