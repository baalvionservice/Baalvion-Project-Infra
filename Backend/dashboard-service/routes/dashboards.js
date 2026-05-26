'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/dashboardController');
const widgetCtrl = require('../controller/widgetController');

router.get('/', authMiddleware, ctrl.listDashboards);
router.post('/', authMiddleware, ctrl.createDashboard);
router.get('/:id', authMiddleware, ctrl.getDashboard);
router.patch('/:id', authMiddleware, ctrl.updateDashboard);
router.delete('/:id', authMiddleware, ctrl.deleteDashboard);
router.post('/:id/duplicate', authMiddleware, ctrl.duplicateDashboard);
router.get('/:id/widgets', authMiddleware, widgetCtrl.listWidgets);
router.post('/:id/widgets', authMiddleware, widgetCtrl.createWidget);

module.exports = router;
