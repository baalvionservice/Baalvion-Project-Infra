'use strict';
// Logistics Core Foundation (Phase 1) — package/cargo units.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/packageController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE, LOGISTICS_PERMISSIONS.SHIPMENT_UPDATE);

/**
 * @openapi
 * /packages:
 *   get:
 *     tags: [Packages]
 *     summary: List packages
 *     parameters:
 *       - { name: shipmentId, in: query, schema: { type: string } }
 *       - { name: containerId, in: query, schema: { type: string } }
 *       - { name: packageType, in: query, schema: { type: string } }
 *       - { name: barcode, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated list of packages }
 *   post:
 *     tags: [Packages]
 *     summary: Create a package
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shipmentId]
 *             properties:
 *               shipmentId: { type: string, format: uuid }
 *               containerId: { type: string, format: uuid }
 *               packageType: { type: string, enum: [box, pallet, container, loose_cargo, hazardous, oversized, temperature_controlled] }
 *               weightKg: { type: number }
 *               barcode: { type: string }
 *     responses:
 *       201: { description: Package created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, manage, c.create);

/**
 * @openapi
 * /packages/{id}:
 *   get:
 *     tags: [Packages]
 *     summary: Get a package by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Package }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Packages]
 *     summary: Update a package
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Package updated }
 *   delete:
 *     tags: [Packages]
 *     summary: Soft-delete a package
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Package deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

module.exports = router;
