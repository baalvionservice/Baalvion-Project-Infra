'use strict';
// Logistics Core Foundation (Phase 3) — shipment incidents.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/incidentController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.INCIDENT_MANAGE);

/**
 * @openapi
 * /incidents:
 *   get:
 *     tags: [Incidents]
 *     summary: List shipment incidents
 *     parameters:
 *       - { name: shipmentId, in: query, schema: { type: string } }
 *       - { name: incidentType, in: query, schema: { type: string } }
 *       - { name: severity, in: query, schema: { type: string, enum: [low, medium, high, critical] } }
 *       - { name: status, in: query, schema: { type: string, enum: [open, investigating, resolved, closed] } }
 *     responses:
 *       200: { description: Paginated list of incidents }
 *   post:
 *     tags: [Incidents]
 *     summary: Report an incident
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shipmentId, incidentType, description]
 *             properties:
 *               shipmentId: { type: string, format: uuid }
 *               incidentType: { type: string, enum: [damage, loss, delay, theft, customs_hold, accident, other] }
 *               severity: { type: string, enum: [low, medium, high, critical] }
 *               description: { type: string }
 *     responses:
 *       201: { description: Incident created }
 */
router.get('/',    authMiddleware, c.list);
router.post('/',   authMiddleware, manage, c.create);

/**
 * @openapi
 * /incidents/{id}:
 *   get:
 *     tags: [Incidents]
 *     summary: Get an incident by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Incident }
 *       404: { description: Not found }
 */
router.get('/:id', authMiddleware, c.get);

/**
 * @openapi
 * /incidents/{id}/investigate:
 *   post:
 *     tags: [Incidents]
 *     summary: Move an incident to investigating (open -> investigating)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Incident under investigation }
 * /incidents/{id}/resolve:
 *   post:
 *     tags: [Incidents]
 *     summary: Resolve an incident (investigating -> resolved)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Incident resolved }
 * /incidents/{id}/close:
 *   post:
 *     tags: [Incidents]
 *     summary: Close an incident (resolved -> closed)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Incident closed }
 */
router.post('/:id/investigate', authMiddleware, manage, c.investigate);
router.post('/:id/resolve',     authMiddleware, manage, c.resolve);
router.post('/:id/close',       authMiddleware, manage, c.close);

module.exports = router;
