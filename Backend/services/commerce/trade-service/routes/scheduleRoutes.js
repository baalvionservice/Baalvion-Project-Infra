'use strict';
// Vessel Sailing Schedules (migration 065) — shipper-facing schedule lookup plus the
// operator/carrier-sync write surface.
//
// Reads are open to any authenticated caller: a sailing schedule is published
// commercial information, and a shipper needs it BEFORE they have a booking. Writes
// require the tracking-manage permission — schedule data is operational truth other
// people plan against, so it isn't self-serve.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/scheduleController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.TRACKING_MANAGE);

// ── Read ──
router.get('/departures', authMiddleware, c.listDepartures);
router.get('/arrivals',   authMiddleware, c.listArrivals);
router.get('/search',     authMiddleware, c.searchLane);
router.get('/routes',     authMiddleware, c.findRoutes);
router.get('/transit',    authMiddleware, c.getTransit);
router.get('/vessels',    authMiddleware, c.listVessels);
router.get('/vessels/:id/position', authMiddleware, c.getVesselPosition);
router.get('/voyages/:id',          authMiddleware, c.getVoyage);

// ── Shipment ↔ sailing binding (migration 068) ──
// Reading your own shipment's schedule is a normal authenticated read; booking it onto
// (or off) a sailing changes operational commitments, so it needs the manage permission.
router.get('/shipments/:shipmentId', authMiddleware, c.getShipmentSchedule);
router.post('/shipments/:shipmentId/assign',   authMiddleware, manage, c.assignShipmentVoyage);
router.delete('/shipments/:shipmentId/assign', authMiddleware, manage, c.unassignShipmentVoyage);
router.post('/shipments/:shipmentId/sync',     authMiddleware, manage, c.syncShipmentSchedule);

// ── Write (schedule ingestion) ──
router.post('/vessels',   authMiddleware, manage, c.createVessel);
router.post('/voyages',   authMiddleware, manage, c.createVoyage);
router.patch('/port_calls/:id', authMiddleware, manage, c.updatePortCall);
// Idempotent bulk ingest — where a carrier schedule feed lands.
router.post('/import',    authMiddleware, manage, c.importSchedule);

module.exports = router;
