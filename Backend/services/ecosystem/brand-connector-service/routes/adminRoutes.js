'use strict';
const { Router } = require('express');
const ctrl = require('../controller/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/stats', authMiddleware, ctrl.getStats);
router.get('/users', authMiddleware, ctrl.listUsers);
router.patch('/users/:id', authMiddleware, ctrl.updateUser);
router.delete('/users/:id', authMiddleware, ctrl.deleteUser);
router.get('/payments', authMiddleware, ctrl.listAllPayments);
router.get('/campaigns', authMiddleware, ctrl.listAllCampaigns);
router.get('/logs', authMiddleware, ctrl.listLogs);

module.exports = router;
