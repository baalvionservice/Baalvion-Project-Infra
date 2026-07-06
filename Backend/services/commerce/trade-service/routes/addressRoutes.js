'use strict';
// Logistics Core Foundation (Phase 1) — logistics address book (distinct from
// /verified_addresses, which is KYC onboarding evidence).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/addressController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.SHIPMENT_UPDATE, LOGISTICS_PERMISSIONS.WAREHOUSE_MANAGE);

/**
 * @openapi
 * /logistics_addresses:
 *   get:
 *     tags: [Addresses]
 *     summary: List logistics addresses
 *     parameters:
 *       - { name: addressType, in: query, schema: { type: string } }
 *       - { name: countryCode, in: query, schema: { type: string } }
 *       - { name: city, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated list of addresses }
 *   post:
 *     tags: [Addresses]
 *     summary: Create a logistics address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [line1, city, countryCode]
 *             properties:
 *               addressType: { type: string, enum: [pickup, delivery, warehouse, port, airport, rail_terminal, billing, company] }
 *               line1: { type: string }
 *               city: { type: string }
 *               countryCode: { type: string, minLength: 2, maxLength: 2 }
 *     responses:
 *       201: { description: Address created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, manage, c.create);

/**
 * @openapi
 * /logistics_addresses/{id}:
 *   get:
 *     tags: [Addresses]
 *     summary: Get a logistics address by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Address }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Addresses]
 *     summary: Update a logistics address
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Address updated }
 *   delete:
 *     tags: [Addresses]
 *     summary: Soft-delete a logistics address
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Address deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

module.exports = router;
