'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { validate } = require('../middleware/validate');
const ctrl = require('../controller/fulfillmentController');
const { createShipmentSchema, updateShipmentSchema, addTrackingEventSchema, createZoneSchema, updateZoneSchema, createRateSchema, updateRateSchema, createCourierSchema, updateCourierSchema } = require('../validators/fulfillmentSchemas');

const router = Router();

// fulfillment_manager (level 50) is the minimum write role for shipment mutations.
// loadStoreRole resolves the caller's capability from RBAC and stamps req.storeRole/req.storeLevel.
// requireStoreRole enforces the minimum; super_admin / store_admin / ops_manager all pass.
router.get('/fulfillment/stores/:storeId/shipments', authMiddleware, ctrl.listShipments);
router.post('/fulfillment/stores/:storeId/shipments', authMiddleware, validate(createShipmentSchema), ctrl.createShipment);
router.get('/fulfillment/stores/:storeId/shipments/:shipmentId', authMiddleware, ctrl.getShipment);
router.patch('/fulfillment/stores/:storeId/shipments/:shipmentId', authMiddleware, loadStoreRole, requireStoreRole('fulfillment_manager'), validate(updateShipmentSchema), ctrl.updateShipment);
router.post('/fulfillment/stores/:storeId/shipments/:shipmentId/tracking', authMiddleware, loadStoreRole, requireStoreRole('fulfillment_manager'), validate(addTrackingEventSchema), ctrl.addTrackingEvent);

router.get('/fulfillment/stores/:storeId/zones', authMiddleware, ctrl.listZones);
router.post('/fulfillment/stores/:storeId/zones', authMiddleware, validate(createZoneSchema), ctrl.createZone);
router.patch('/fulfillment/stores/:storeId/zones/:zoneId', authMiddleware, validate(updateZoneSchema), ctrl.updateZone);
router.delete('/fulfillment/stores/:storeId/zones/:zoneId', authMiddleware, ctrl.deleteZone);
router.post('/fulfillment/stores/:storeId/zones/:zoneId/rates', authMiddleware, validate(createRateSchema), ctrl.addRate);
router.patch('/fulfillment/stores/:storeId/rates/:rateId', authMiddleware, validate(updateRateSchema), ctrl.updateRate);
router.delete('/fulfillment/stores/:storeId/rates/:rateId', authMiddleware, ctrl.deleteRate);

router.get('/fulfillment/stores/:storeId/couriers', authMiddleware, ctrl.listCouriers);
router.post('/fulfillment/stores/:storeId/couriers', authMiddleware, validate(createCourierSchema), ctrl.createCourier);
router.patch('/fulfillment/stores/:storeId/couriers/:courierId', authMiddleware, validate(updateCourierSchema), ctrl.updateCourier);

module.exports = router;
