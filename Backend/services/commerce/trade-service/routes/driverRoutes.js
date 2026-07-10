'use strict';
// Logistics Core Foundation (Phase 2) — fleet drivers.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/driverController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.FLEET_MANAGE, LOGISTICS_PERMISSIONS.DRIVER_ASSIGN);

/**
 * @openapi
 * /drivers:
 *   get:
 *     tags: [Drivers]
 *     summary: List fleet drivers
 *     parameters:
 *       - { name: status, in: query, schema: { type: string } }
 *       - { name: currentVehicleId, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated list of drivers }
 *   post:
 *     tags: [Drivers]
 *     summary: Create a driver
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName]
 *             properties:
 *               fullName: { type: string }
 *               licenseNumber: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: Driver created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, manage, c.create);

/**
 * @openapi
 * /drivers/{id}:
 *   get:
 *     tags: [Drivers]
 *     summary: Get a driver by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Driver }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Drivers]
 *     summary: Update a driver
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Driver updated }
 *   delete:
 *     tags: [Drivers]
 *     summary: Soft-delete a driver
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Driver deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

module.exports = router;
