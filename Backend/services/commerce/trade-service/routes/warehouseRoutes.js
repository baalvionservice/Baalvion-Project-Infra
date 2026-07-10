'use strict';
// Logistics Core Foundation (Phase 2) — operational warehouses.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/warehouseController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_MANAGE);

/**
 * @openapi
 * /warehouses:
 *   get:
 *     tags: [Warehouses]
 *     summary: List warehouses
 *     parameters:
 *       - { name: warehouseType, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated list of warehouses }
 *   post:
 *     tags: [Warehouses]
 *     summary: Create a warehouse
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               warehouseType: { type: string, enum: [distribution, fulfillment, cold_storage, bonded, cross_dock] }
 *               addressId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Warehouse created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, manage, c.create);

/**
 * @openapi
 * /warehouses/{id}:
 *   get:
 *     tags: [Warehouses]
 *     summary: Get a warehouse by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Warehouses]
 *     summary: Update a warehouse
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse updated }
 *   delete:
 *     tags: [Warehouses]
 *     summary: Soft-delete a warehouse
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Warehouse deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

module.exports = router;
