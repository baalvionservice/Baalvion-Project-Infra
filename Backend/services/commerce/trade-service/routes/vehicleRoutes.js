'use strict';
// Logistics Core Foundation (Phase 2) — fleet vehicles.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/vehicleController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.FLEET_MANAGE);

/**
 * @openapi
 * /vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: List fleet vehicles
 *     parameters:
 *       - { name: vehicleType, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated list of vehicles }
 *   post:
 *     tags: [Vehicles]
 *     summary: Create a vehicle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleNumber]
 *             properties:
 *               vehicleNumber: { type: string }
 *               vehicleType: { type: string, enum: [truck, van, trailer, rail_car, ship, aircraft] }
 *     responses:
 *       201: { description: Vehicle created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, manage, c.create);

/**
 * @openapi
 * /vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get a vehicle by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Vehicle }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Vehicles]
 *     summary: Update a vehicle
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Vehicle updated }
 *   delete:
 *     tags: [Vehicles]
 *     summary: Soft-delete a vehicle
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Vehicle deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

module.exports = router;
