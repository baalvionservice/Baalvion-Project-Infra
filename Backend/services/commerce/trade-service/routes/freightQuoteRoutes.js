'use strict';
// Freight Management — Quote Requests (Phase 3, Prompt 2). Mounted at
// /v1/freight/quote-requests — distinct from the ephemeral marketplace comparison
// at /v1/freight/quotes (freightMarketplaceRoutes.js). Registered in routes/v1.js
// BEFORE freightMarketplaceRoutes so this more specific prefix isn't shadowed by
// that router's generic GET /:id booking-lookup route.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/freightQuoteController');

const create = requirePermission(LOGISTICS_PERMISSIONS.FREIGHT_QUOTE_CREATE);

/**
 * @openapi
 * /freight/quote-requests:
 *   get:
 *     tags: [Freight Quotes]
 *     summary: List persisted freight quote requests
 *     parameters:
 *       - { name: status, in: query, schema: { type: string, enum: [draft, quoted, expired, converted] } }
 *       - { name: shipmentId, in: query, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Paginated list of freight quotes }
 *   post:
 *     tags: [Freight Quotes]
 *     summary: Request a freight quote — fans out across every active carrier in the Carrier Directory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [origin, destination, pieces]
 *             properties:
 *               origin: { type: object }
 *               destination: { type: object }
 *               pieces: { type: array, items: { type: object } }
 *               transportMode: { type: string, enum: [express, air, ocean, road] }
 *               incoterm: { type: string }
 *               insuranceRequested: { type: boolean }
 *               declaredValue: { type: number }
 *     responses:
 *       201: { description: Quote created with per-carrier priced items + scored comparison }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',  authMiddleware, c.list);
router.post('/', authMiddleware, create, c.create);

/**
 * @openapi
 * /freight/quote-requests/{id}:
 *   get:
 *     tags: [Freight Quotes]
 *     summary: Get a freight quote with its priced items + comparison scoring
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Freight quote }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/:id', authMiddleware, c.get);

module.exports = router;
