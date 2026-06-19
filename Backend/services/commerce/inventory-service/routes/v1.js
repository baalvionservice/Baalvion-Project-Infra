'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { validate } = require('../middleware/validate');
const ctrl = require('../controller/warehouseController');
const { createWarehouseSchema, updateWarehouseSchema, adjustStockSchema } = require('../validators/inventorySchemas');

const router = Router();

// Every inventory endpoint is admin/operational and store-scoped via RBAC.
// authMiddleware (authn) → loadStoreRole (resolve store capability) → requireStoreRole (authz).
// Reads require any store role (store_viewer); writes require operations-level (ops_manager).
const read = [authMiddleware, loadStoreRole, requireStoreRole('store_viewer')];
const write = [authMiddleware, loadStoreRole, requireStoreRole('ops_manager')];

router.get('/inventory/stores/:storeId/stock', ...read, ctrl.listAllStock);
router.get('/inventory/stores/:storeId/alerts/low-stock', ...read, ctrl.lowStockAlerts);
router.get('/inventory/stores/:storeId/movements', ...read, ctrl.listMovements);

router.get('/inventory/stores/:storeId/warehouses', ...read, ctrl.listWarehouses);
router.post('/inventory/stores/:storeId/warehouses', ...write, validate(createWarehouseSchema), ctrl.createWarehouse);
router.get('/inventory/stores/:storeId/warehouses/:warehouseId', ...read, ctrl.getWarehouse);
router.patch('/inventory/stores/:storeId/warehouses/:warehouseId', ...write, validate(updateWarehouseSchema), ctrl.updateWarehouse);
router.delete('/inventory/stores/:storeId/warehouses/:warehouseId', ...write, requireStoreRole('store_admin'), ctrl.deleteWarehouse);
router.get('/inventory/stores/:storeId/warehouses/:warehouseId/stock', ...read, ctrl.listStock);
router.post('/inventory/stores/:storeId/warehouses/:warehouseId/stock/adjust', ...write, validate(adjustStockSchema), ctrl.adjustStock);

module.exports = router;
