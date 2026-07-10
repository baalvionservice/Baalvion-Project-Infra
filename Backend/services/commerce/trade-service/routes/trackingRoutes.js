'use strict';
// Logistics Core Foundation (Phase 1) — GPS/carrier tracking events (append-only).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/trackingController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.TRACKING_MANAGE);

/**
 * @openapi
 * /tracking_events:
 *   get:
 *     tags: [Tracking]
 *     summary: List tracking events
 *     parameters:
 *       - { name: shipmentId, in: query, schema: { type: string } }
 *       - { name: containerId, in: query, schema: { type: string } }
 *       - { name: source, in: query, schema: { type: string, enum: [carrier_webhook, gps_device, manual] } }
 *     responses:
 *       200: { description: Paginated list of tracking events }
 *   post:
 *     tags: [Tracking]
 *     summary: Record a single tracking event (synchronous write)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shipmentId, eventType]
 *             properties:
 *               shipmentId: { type: string, format: uuid }
 *               containerId: { type: string, format: uuid }
 *               source: { type: string, enum: [carrier_webhook, gps_device, manual] }
 *               eventType: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       201: { description: Tracking event recorded }
 */
router.get('/',    authMiddleware, c.list);
router.post('/',   authMiddleware, manage, c.create);

/**
 * @openapi
 * /tracking_events/{id}:
 *   get:
 *     tags: [Tracking]
 *     summary: Get a tracking event by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Tracking event }
 *       404: { description: Not found }
 */
router.get('/:id', authMiddleware, c.get);

/**
 * @openapi
 * /tracking_events/ingest:
 *   post:
 *     tags: [Tracking]
 *     summary: Bulk/async ingest tracking events (enqueued onto the tracking_sync BullMQ queue)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               events:
 *                 type: array
 *                 items: { type: object }
 *     responses:
 *       202: { description: Events queued for async processing }
 */
router.post('/ingest', authMiddleware, manage, c.ingest);

module.exports = router;
