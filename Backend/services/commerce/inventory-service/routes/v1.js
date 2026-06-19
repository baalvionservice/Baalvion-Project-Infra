'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { validate } = require('../middleware/validate');
const ctrl = require('../controller/warehouseController');
const reservationCtrl = require('../controller/reservationController');
const { createWarehouseSchema, updateWarehouseSchema, adjustStockSchema, lockSchema, confirmLockSchema, bulkStockSchema } = require('../validators/inventorySchemas');

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

// ── Reservation / lock API (storefront checkout: prevents oversell of unique luxury items) ──
// Variant-level stock lookup is a read; reserving/releasing/confirming mutates reserved/on-hand
// stock so it is gated at operations level (ops_manager), matching how stock adjust is gated.
router.get('/inventory/stores/:storeId/stock/:variantId', ...read, reservationCtrl.getStock);
router.post('/inventory/stores/:storeId/stock/bulk', ...read, validate(bulkStockSchema), reservationCtrl.getBulkStock);
router.post('/inventory/stores/:storeId/locks', ...write, validate(lockSchema), reservationCtrl.lock);
router.post('/inventory/stores/:storeId/locks/:lockId/release', ...write, reservationCtrl.release);
router.post('/inventory/stores/:storeId/locks/:lockId/confirm', ...write, validate(confirmLockSchema), reservationCtrl.confirm);

module.exports = router;
