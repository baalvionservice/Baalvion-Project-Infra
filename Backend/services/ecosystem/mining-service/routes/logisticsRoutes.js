'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/logisticsController');

router.get('/', authMiddleware, ctrl.listShipments);
router.get('/:id', authMiddleware, ctrl.getShipment);
router.post('/', authMiddleware, ctrl.createShipment);
router.patch('/:id', authMiddleware, ctrl.updateShipment);
router.post('/:id/checkpoint', authMiddleware, ctrl.addCheckpoint);

module.exports = router;
