'use strict';
// Warehouse Management System, Phase A — putaway tasks.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/putawayController');

const putaway = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_PUTAWAY);

/**
 * @openapi
 * /putaway_tasks:
 *   get:
 *     tags: [Putaway Tasks]
 *     summary: List putaway tasks
 *     parameters:
 *       - { name: warehouseId, in: query, schema: { type: string, format: uuid } }
 *       - { name: status, in: query, schema: { type: string, enum: [pending, suggested, assigned, completed, cancelled] } }
 *     responses:
 *       200: { description: Paginated list of putaway tasks }
 */
router.get('/', authMiddleware, c.list);

/**
 * @openapi
 * /putaway_tasks/suggest:
 *   post:
 *     tags: [Putaway Tasks]
 *     summary: Run the rule-based putaway engine and persist a suggested task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, quantity]
 *             properties:
 *               warehouseId: { type: string, format: uuid }
 *               grnLineId: { type: string, format: uuid }
 *               zoneId: { type: string, format: uuid }
 *               quantity: { type: number }
 *               strategy: { type: string, enum: [fifo, fefo, abc, capacity_first] }
 *     responses:
 *       201: { description: Putaway task created with a bin suggestion (or pending if none qualified) }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.post('/suggest', authMiddleware, putaway, c.suggest);

/**
 * @openapi
 * /putaway_tasks/{id}:
 *   get:
 *     tags: [Putaway Tasks]
 *     summary: Get a putaway task by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Putaway task }
 *       404: { description: Not found }
 */
router.get('/:id', authMiddleware, c.get);

/**
 * @openapi
 * /putaway_tasks/{id}/assign:
 *   post:
 *     tags: [Putaway Tasks]
 *     summary: Accept the suggestion or manually override it with a different bin
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [binId]
 *             properties:
 *               binId: { type: string, format: uuid }
 *               overrideReason: { type: string }
 *     responses:
 *       200: { description: Putaway task assigned }
 *       409: { description: Invalid transition }
 */
router.post('/:id/assign', authMiddleware, putaway, c.assign);

/**
 * @openapi
 * /putaway_tasks/{id}/complete:
 *   post:
 *     tags: [Putaway Tasks]
 *     summary: Complete an assigned putaway task — writes the inventory movement and updates bin capacity
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Putaway task completed }
 *       409: { description: Invalid transition (task must be 'assigned') }
 */
router.post('/:id/complete', authMiddleware, putaway, c.complete);

module.exports = router;
