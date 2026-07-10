'use strict';
// Freight Management — Carrier Directory (Phase 3, Prompt 2). Mounted at
// /v1/freight/carrier-directory, distinct from the marketplace descriptor at
// /v1/freight/carriers and the legacy read-only /v1/carriers shim.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/carrierDirectoryController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.FREIGHT_CARRIER_MANAGE);

/**
 * @openapi
 * /freight/carrier-directory:
 *   get:
 *     tags: [Freight Carrier Directory]
 *     summary: List carriers in the dynamic carrier directory
 *     parameters:
 *       - { name: status, in: query, schema: { type: string, enum: [active, suspended, inactive] } }
 *       - { name: availabilityStatus, in: query, schema: { type: string, enum: [active, limited, inactive] } }
 *       - { name: country, in: query, schema: { type: string } }
 *       - { name: page, in: query, schema: { type: integer } }
 *       - { name: limit, in: query, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated list of carriers }
 *   post:
 *     tags: [Freight Carrier Directory]
 *     summary: Register a new carrier (any carrier — no hardcoded provider list)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               connectorKey: { type: string, enum: [dhl, fedex, ups, maersk] }
 *               modes: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Carrier created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 *       409: { description: Carrier code already exists }
 */
router.get('/',  authMiddleware, c.list);
router.post('/', authMiddleware, manage, c.create);

/**
 * @openapi
 * /freight/carrier-directory/{id}:
 *   get:
 *     tags: [Freight Carrier Directory]
 *     summary: Get a carrier by id (with services + regions)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Carrier }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 *   patch:
 *     tags: [Freight Carrier Directory]
 *     summary: Update a carrier
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Carrier updated }
 *   delete:
 *     tags: [Freight Carrier Directory]
 *     summary: Soft-delete a carrier
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Carrier deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

/**
 * @openapi
 * /freight/carrier-directory/{id}/services:
 *   post:
 *     tags: [Freight Carrier Directory]
 *     summary: Add a service offering (mode + rate card) to a carrier
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       201: { description: Carrier service added }
 */
router.post('/:id/services', authMiddleware, manage, c.addService);
router.delete('/:id/services/:serviceId', authMiddleware, manage, c.removeService);

/**
 * @openapi
 * /freight/carrier-directory/{id}/regions:
 *   post:
 *     tags: [Freight Carrier Directory]
 *     summary: Add a coverage region (country/lane/port-pair) to a carrier
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       201: { description: Carrier region added }
 */
router.post('/:id/regions', authMiddleware, manage, c.addRegion);
router.delete('/:id/regions/:regionId', authMiddleware, manage, c.removeRegion);

module.exports = router;
