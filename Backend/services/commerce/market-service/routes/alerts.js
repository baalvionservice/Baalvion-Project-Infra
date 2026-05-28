'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/alertController');

router.get('/', authMiddleware, ctrl.listAlerts);
router.post('/', authMiddleware, ctrl.createAlert);
router.patch('/:id', authMiddleware, ctrl.updateAlert);
router.delete('/:id', authMiddleware, ctrl.deleteAlert);

module.exports = router;
