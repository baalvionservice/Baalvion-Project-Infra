'use strict';
const { Router } = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { requireInternalKey } = require('../middleware/internalAuth');
const { validate } = require('../middleware/validate');
const ctrl = require('../controller/warehouseController');
const reservationCtrl = require('../controller/reservationController');
const { createWarehouseSchema, updateWarehouseSchema, adjustStockSchema, lockSchema, confirmLockSchema, bulkStockSchema } = require('../validators/inventorySchemas');

const router = Router();

// Warehouse/stock-admin endpoints are admin/operational and store-scoped via RBAC.
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
// AUTH MODEL (coherent storefront ⇄ internal split):
//   • getStock / getBulkStock — STOREFRONT-READABLE. optionalAuth: a logged-in shopper's token is
//     validated if present, an anonymous shopper still gets a stock lookup. The storefront needs
//     this to render availability, so it must NOT require an ops role.
//   • locks (reserve) / release — SHOPPER-CAPABLE cart holds. optionalAuth (guest-capable): the
//     hold is bound to req.auth.userId when authenticated, else a guest hold is allowed. A short
//     reservation TTL + the global IP rate limit bound abuse. Releasing your own hold is also a
//     shopper action (and is idempotent server-side).
//   • confirm — INTERNAL-ONLY. Confirming commits stock (drops on-hand) WITHOUT payment, so a
//     browser/shopper must NEVER reach it. requireInternalKey enforces a matching X-Internal-Key
//     (INVENTORY_INTERNAL_KEY) — order-service's payment-capture path is the only caller. If no
//     key is configured (dev) it falls back to requiring the ops_manager RBAC chain (never open).
//     optionalAuth runs first so a platform/ops staff token (when a key IS set) is available as the
//     documented staff fallback.
router.get('/inventory/stores/:storeId/stock/:variantId', optionalAuth, reservationCtrl.getStock);
router.post('/inventory/stores/:storeId/stock/bulk', optionalAuth, validate(bulkStockSchema), reservationCtrl.getBulkStock);
router.post('/inventory/stores/:storeId/locks', optionalAuth, validate(lockSchema), reservationCtrl.lock);
router.post('/inventory/stores/:storeId/locks/:lockId/release', optionalAuth, reservationCtrl.release);
router.post('/inventory/stores/:storeId/locks/:lockId/confirm', optionalAuth, requireInternalKey([authMiddleware, loadStoreRole, requireStoreRole('ops_manager')]), validate(confirmLockSchema), reservationCtrl.confirm);

module.exports = router;
