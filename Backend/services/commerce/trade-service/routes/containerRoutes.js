'use strict';
// Logistics Core Foundation (Phase 1) — shipping containers.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/containerController');

const manage = requirePermission(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE);

/**
 * @openapi
 * /containers:
 *   get:
 *     tags: [Containers]
 *     summary: List containers
 *     parameters:
 *       - { name: shipmentId, in: query, schema: { type: string } }
 *       - { name: status, in: query, schema: { type: string } }
 *       - { name: containerType, in: query, schema: { type: string } }
 *       - { name: page, in: query, schema: { type: integer } }
 *       - { name: limit, in: query, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated list of containers }
 *   post:
 *     tags: [Containers]
 *     summary: Create a container
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [containerNumber]
 *             properties:
 *               shipmentId: { type: string, format: uuid }
 *               containerNumber: { type: string }
 *               containerType: { type: string, enum: [20ft, 40ft, 40hc, 45hc, lcl, fcl, reefer, tank, open_top, flat_rack] }
 *               isoCode: { type: string }
 *               sealNumber: { type: string }
 *     responses:
 *       201: { description: Container created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, manage, c.create);

/**
 * @openapi
 * /containers/{id}:
 *   get:
 *     tags: [Containers]
 *     summary: Get a container by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Container }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 *   patch:
 *     tags: [Containers]
 *     summary: Update a container
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Container updated }
 *   delete:
 *     tags: [Containers]
 *     summary: Soft-delete a container
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Container deleted }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, manage, c.update);
router.delete('/:id', authMiddleware, manage, c.remove);

module.exports = router;
