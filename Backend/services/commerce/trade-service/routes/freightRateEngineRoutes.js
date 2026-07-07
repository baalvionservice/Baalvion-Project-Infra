'use strict';
// Freight Management — Rate Engine (Phase 3, Prompt 2). Mounted at
// /v1/freight/rate-rules (CRUD) + /v1/freight/rate-preview (stateless compute),
// both under the /freight prefix alongside the marketplace + carrier directory.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/freightRateEngineController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.FREIGHT_RATE_MANAGE);

/**
 * @openapi
 * /freight/rate-preview:
 *   post:
 *     tags: [Freight Rate Engine]
 *     summary: Resolve a rate by applying the tenant's active pricing rules to a lane/carrier/weight combo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [baseRate]
 *             properties:
 *               carrierId: { type: string, format: uuid }
 *               originCode: { type: string }
 *               destinationCode: { type: string }
 *               mode: { type: string }
 *               baseRate: { type: number }
 *               weightKg: { type: number }
 *               volumeCbm: { type: number }
 *               fuelPct: { type: number }
 *     responses:
 *       200: { description: Computed rate + applied rule breakdown }
 */
router.post('/rate-preview', authMiddleware, c.preview);

/**
 * @openapi
 * /freight/rate-rules:
 *   get:
 *     tags: [Freight Rate Engine]
 *     summary: List pricing rules
 *     parameters:
 *       - { name: ruleType, in: query, schema: { type: string } }
 *       - { name: carrierId, in: query, schema: { type: string, format: uuid } }
 *       - { name: active, in: query, schema: { type: boolean } }
 *     responses:
 *       200: { description: Paginated list of pricing rules }
 *   post:
 *     tags: [Freight Rate Engine]
 *     summary: Create a pricing rule (lane/weight/volume/seasonal/peak/contract/country/discount/markup)
 *     responses:
 *       201: { description: Rule created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/rate-rules',  authMiddleware, c.list);
router.post('/rate-rules', authMiddleware, manage, c.create);

/**
 * @openapi
 * /freight/rate-rules/{id}:
 *   get:
 *     tags: [Freight Rate Engine]
 *     summary: Get a pricing rule by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Pricing rule }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 *   patch:
 *     tags: [Freight Rate Engine]
 *     summary: Update a pricing rule
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Rule updated }
 *   delete:
 *     tags: [Freight Rate Engine]
 *     summary: Soft-delete a pricing rule
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Rule deleted }
 */
router.get('/rate-rules/:id',   authMiddleware, c.get);
router.patch('/rate-rules/:id', authMiddleware, manage, c.update);
router.delete('/rate-rules/:id', authMiddleware, manage, c.remove);

module.exports = router;
