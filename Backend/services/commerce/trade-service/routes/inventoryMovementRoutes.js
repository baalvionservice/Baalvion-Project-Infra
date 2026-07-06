'use strict';
// Logistics Core Foundation (Phase 2) — inventory movement ledger (append-only).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/inventoryMovementController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_MANAGE);

/**
 * @openapi
 * /inventory_movements:
 *   get:
 *     tags: [Inventory Movements]
 *     summary: List inventory movements
 *     parameters:
 *       - { name: warehouseId, in: query, schema: { type: string } }
 *       - { name: packageId, in: query, schema: { type: string } }
 *       - { name: movementType, in: query, schema: { type: string, enum: [inbound, outbound, transfer, adjustment] } }
 *     responses:
 *       200: { description: Paginated list of inventory movements }
 *   post:
 *     tags: [Inventory Movements]
 *     summary: Record an inventory movement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, movementType, quantity]
 *             properties:
 *               warehouseId: { type: string, format: uuid }
 *               packageId: { type: string, format: uuid }
 *               movementType: { type: string, enum: [inbound, outbound, transfer, adjustment] }
 *               quantity: { type: number }
 *     responses:
 *       201: { description: Movement recorded }
 */
router.get('/',    authMiddleware, c.list);
router.post('/',   authMiddleware, manage, c.create);

/**
 * @openapi
 * /inventory_movements/{id}:
 *   get:
 *     tags: [Inventory Movements]
 *     summary: Get an inventory movement by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Inventory movement }
 *       404: { description: Not found }
 */
router.get('/:id', authMiddleware, c.get);

module.exports = router;
