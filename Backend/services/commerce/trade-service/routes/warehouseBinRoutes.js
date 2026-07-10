'use strict';
// Warehouse Management System, Phase A — warehouse bins (aisle/rack/shelf/bin).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/warehouseBinController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_ZONE_MANAGE);

/**
 * @openapi
 * /warehouse_bins:
 *   get:
 *     tags: [Warehouse Bins]
 *     summary: List warehouse bins
 *     parameters:
 *       - { name: warehouseId, in: query, schema: { type: string, format: uuid } }
 *       - { name: zoneId, in: query, schema: { type: string, format: uuid } }
 *       - { name: parentBinId, in: query, schema: { type: string, format: uuid } }
 *       - { name: binType, in: query, schema: { type: string, enum: [aisle, rack, shelf, bin] } }
 *       - { name: status, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated list of warehouse bins }
 *   post:
 *     tags: [Warehouse Bins]
 *     summary: Create a warehouse bin (or aisle/rack/shelf)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, zoneId]
 *             properties:
 *               warehouseId: { type: string, format: uuid }
 *               zoneId: { type: string, format: uuid }
 *               parentBinId: { type: string, format: uuid }
 *               binType: { type: string, enum: [aisle, rack, shelf, bin] }
 *     responses:
 *       201: { description: Warehouse bin created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, manage, c.create);

/**
 * @openapi
 * /warehouse_bins/{id}:
 *   get:
 *     tags: [Warehouse Bins]
 *     summary: Get a warehouse bin by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse bin }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Warehouse Bins]
 *     summary: Update a warehouse bin
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse bin updated }
 *   delete:
 *     tags: [Warehouse Bins]
 *     summary: Soft-delete a warehouse bin
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse bin deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

/**
 * @openapi
 * /warehouse_bins/{id}/label:
 *   get:
 *     tags: [Warehouse Bins]
 *     summary: Render the bin's QR label as SVG
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: SVG QR label, content: { image/svg+xml: {} } }
 */
router.get('/:id/label', authMiddleware, c.label);

module.exports = router;
