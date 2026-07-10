'use strict';
// Freight Management — Carrier Performance (Phase 3, Prompt 2). Mounted at
// /v1/freight/carrier-performance.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const c = require('../controller/carrierPerformanceController');

/**
 * @openapi
 * /freight/carrier-performance:
 *   get:
 *     tags: [Carrier Performance]
 *     summary: List periodic carrier performance snapshots
 *     parameters:
 *       - { name: carrierId, in: query, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Paginated list of performance snapshots }
 */
router.get('/', authMiddleware, c.list);

/**
 * @openapi
 * /freight/carrier-performance/refresh:
 *   post:
 *     tags: [Carrier Performance]
 *     summary: Trigger an on-demand performance refresh cycle (admin only)
 *     responses:
 *       200: { description: Refresh cycle result }
 *       403: { description: Forbidden, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.post('/refresh', authMiddleware, c.refresh);

/**
 * @openapi
 * /freight/carrier-performance/{carrierId}/latest:
 *   get:
 *     tags: [Carrier Performance]
 *     summary: Get a carrier's latest performance snapshot
 *     parameters: [{ name: carrierId, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Latest performance snapshot }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/:carrierId/latest', authMiddleware, c.latest);

module.exports = router;
