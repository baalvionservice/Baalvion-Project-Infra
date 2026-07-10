'use strict';
// Logistics Core Foundation (Phase 2) — fleet assignments (vehicle + driver -> shipment).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/fleetAssignmentController');

const assign = requirePermission(LOGISTICS_PERMISSIONS.DRIVER_ASSIGN, LOGISTICS_PERMISSIONS.FLEET_MANAGE);

/**
 * @openapi
 * /fleet_assignments:
 *   get:
 *     tags: [Fleet Assignments]
 *     summary: List fleet assignments
 *     parameters:
 *       - { name: vehicleId, in: query, schema: { type: string } }
 *       - { name: driverId, in: query, schema: { type: string } }
 *       - { name: shipmentId, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string, enum: [assigned, in_progress, completed, cancelled] } }
 *     responses:
 *       200: { description: Paginated list of fleet assignments }
 *   post:
 *     tags: [Fleet Assignments]
 *     summary: Assign a vehicle + driver (optionally to a shipment)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, driverId]
 *             properties:
 *               vehicleId: { type: string, format: uuid }
 *               driverId: { type: string, format: uuid }
 *               shipmentId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Fleet assignment created }
 *       404: { description: Vehicle or driver not found }
 */
router.get('/',    authMiddleware, c.list);
router.post('/',   authMiddleware, assign, c.create);

/**
 * @openapi
 * /fleet_assignments/{id}:
 *   get:
 *     tags: [Fleet Assignments]
 *     summary: Get a fleet assignment by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Fleet assignment }
 *       404: { description: Not found }
 */
router.get('/:id', authMiddleware, c.get);

/**
 * @openapi
 * /fleet_assignments/{id}/start:
 *   post:
 *     tags: [Fleet Assignments]
 *     summary: Start the assignment (assigned -> in_progress); locks the vehicle/driver
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Assignment started }
 *       409: { description: Invalid transition, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 * /fleet_assignments/{id}/complete:
 *   post:
 *     tags: [Fleet Assignments]
 *     summary: Complete the assignment (in_progress -> completed); frees the vehicle/driver
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Assignment completed }
 * /fleet_assignments/{id}/cancel:
 *   post:
 *     tags: [Fleet Assignments]
 *     summary: Cancel the assignment (assigned/in_progress -> cancelled)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Assignment cancelled }
 */
router.post('/:id/start',    authMiddleware, assign, c.start);
router.post('/:id/complete', authMiddleware, assign, c.complete);
router.post('/:id/cancel',   authMiddleware, assign, c.cancel);

module.exports = router;
