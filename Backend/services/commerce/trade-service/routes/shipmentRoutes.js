'use strict';
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const {
    listShipments, getShipment, createShipment, updateShipment,
    addMilestone, addException, updateShipmentStatus,
    trackShipment, refreshTracking, sweepTracking,
} = require('../controller/shipmentController');

// Tracking endpoints rely on tenantContext (the gateway is the auth boundary, like the marketplace
// + generic-store reads) so the live carrier-tracking view is reachable without a bearer.
router.post('/tracking/sweep',     sweepTracking);          // batch refresh (scheduler/worker)
router.get('/:id/track',           trackShipment);          // read-only tracking view
router.post('/:id/track/refresh',  refreshTracking);        // advance from the carrier provider

router.get('/',                    authMiddleware, listShipments);
router.get('/:id',                 authMiddleware, getShipment);
router.post('/',                   authMiddleware, createShipment);
router.put('/:id',                 authMiddleware, updateShipment);
router.patch('/:id',               authMiddleware, updateShipment);
// Booking a shipment can plausibly be initiated by whoever needs the cargo moved (buyer or
// seller); recording an operational milestone/exception/status change is the carrier's own event.
router.post('/:id/milestones',     authMiddleware, requireOrgType('logistics_provider'), addMilestone);
router.post('/:id/exceptions',     authMiddleware, requireOrgType('logistics_provider'), addException);
router.patch('/:id/status',        authMiddleware, requireOrgType('logistics_provider'), updateShipmentStatus);

module.exports = router;
