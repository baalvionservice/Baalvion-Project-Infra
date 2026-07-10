'use strict';
// Warehouse Management System, Phase A — warehouse zones.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/warehouseZoneController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_ZONE_MANAGE);

/**
 * @openapi
 * /warehouse_zones:
 *   get:
 *     tags: [Warehouse Zones]
 *     summary: List warehouse zones
 *     parameters:
 *       - { name: warehouseId, in: query, schema: { type: string, format: uuid } }
 *       - { name: zoneType, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated list of warehouse zones }
 *   post:
 *     tags: [Warehouse Zones]
 *     summary: Create a warehouse zone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, name]
 *             properties:
 *               warehouseId: { type: string, format: uuid }
 *               name: { type: string }
 *               zoneType: { type: string, enum: [storage, receiving, staging, packing, hazmat, cold_storage, quarantine, cross_dock] }
 *     responses:
 *       201: { description: Warehouse zone created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, manage, c.create);

/**
 * @openapi
 * /warehouse_zones/{id}:
 *   get:
 *     tags: [Warehouse Zones]
 *     summary: Get a warehouse zone by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse zone }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Warehouse Zones]
 *     summary: Update a warehouse zone
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse zone updated }
 *   delete:
 *     tags: [Warehouse Zones]
 *     summary: Soft-delete a warehouse zone
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse zone deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

/**
 * @openapi
 * /warehouse_zones/{id}/label:
 *   get:
 *     tags: [Warehouse Zones]
 *     summary: Render the zone's QR label as SVG
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: SVG QR label, content: { image/svg+xml: {} } }
 */
router.get('/:id/label', authMiddleware, c.label);

module.exports = router;
