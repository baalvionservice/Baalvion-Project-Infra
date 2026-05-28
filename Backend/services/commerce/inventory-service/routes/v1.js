'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const ctrl = require('../controller/warehouseController');
const { createWarehouseSchema, updateWarehouseSchema, adjustStockSchema } = require('../validators/inventorySchemas');

const router = Router();

router.get('/inventory/stores/:storeId/stock', authMiddleware, ctrl.listAllStock);
router.get('/inventory/stores/:storeId/movements', authMiddleware, ctrl.listMovements);

router.get('/inventory/stores/:storeId/warehouses', authMiddleware, ctrl.listWarehouses);
router.post('/inventory/stores/:storeId/warehouses', authMiddleware, validate(createWarehouseSchema), ctrl.createWarehouse);
router.get('/inventory/stores/:storeId/warehouses/:warehouseId', authMiddleware, ctrl.getWarehouse);
router.patch('/inventory/stores/:storeId/warehouses/:warehouseId', authMiddleware, validate(updateWarehouseSchema), ctrl.updateWarehouse);
router.delete('/inventory/stores/:storeId/warehouses/:warehouseId', authMiddleware, ctrl.deleteWarehouse);
router.get('/inventory/stores/:storeId/warehouses/:warehouseId/stock', authMiddleware, ctrl.listStock);
router.post('/inventory/stores/:storeId/warehouses/:warehouseId/stock/adjust', authMiddleware, validate(adjustStockSchema), ctrl.adjustStock);

module.exports = router;
