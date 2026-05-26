'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/warehouseController');

router.get('/', ctrl.listWarehouses);
router.post('/', authMiddleware, ctrl.createWarehouse);
router.get('/:id', ctrl.getWarehouse);
router.patch('/:id', authMiddleware, ctrl.updateWarehouse);
router.delete('/:id', authMiddleware, ctrl.deleteWarehouse);

module.exports = router;
