'use strict';
// Warehouse Management System, Phase A — receiving + Goods Receipt Notes.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/goodsReceiptController');

const receive = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_RECEIVE);

/**
 * @openapi
 * /goods_receipt_notes:
 *   get:
 *     tags: [Goods Receipt Notes]
 *     summary: List goods receipt notes
 *     parameters:
 *       - { name: warehouseId, in: query, schema: { type: string, format: uuid } }
 *       - { name: status, in: query, schema: { type: string, enum: [draft, in_progress, completed, cancelled] } }
 *     responses:
 *       200: { description: Paginated list of goods receipt notes }
 *   post:
 *     tags: [Goods Receipt Notes]
 *     summary: Open a new goods receipt note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId]
 *             properties:
 *               warehouseId: { type: string, format: uuid }
 *               purchaseOrderId: { type: string, format: uuid }
 *               shipmentId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Goods receipt note created }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.get('/',      authMiddleware, c.list);
router.post('/',     authMiddleware, receive, c.create);

/**
 * @openapi
 * /goods_receipt_notes/{id}:
 *   get:
 *     tags: [Goods Receipt Notes]
 *     summary: Get a goods receipt note (with lines) by id
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Goods receipt note }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Goods Receipt Notes]
 *     summary: Update a goods receipt note's header fields
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Goods receipt note updated }
 */
router.get('/:id',   authMiddleware, c.get);
router.patch('/:id', authMiddleware, receive, c.update);

/**
 * @openapi
 * /goods_receipt_notes/{id}/lines:
 *   post:
 *     tags: [Goods Receipt Notes]
 *     summary: Add a line item (flips draft -> in_progress on the first line)
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       201: { description: Line created }
 *       409: { description: Invalid transition (GRN is completed/cancelled) }
 */
router.post('/:id/lines', authMiddleware, receive, c.addLine);

/**
 * @openapi
 * /goods_receipt_notes/{id}/lines/{lineId}:
 *   patch:
 *     tags: [Goods Receipt Notes]
 *     summary: Update a line item (quantity received, condition, lot/expiry, ...)
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
 *       - { name: lineId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Line updated }
 */
router.patch('/:id/lines/:lineId', authMiddleware, receive, c.updateLine);

/**
 * @openapi
 * /goods_receipt_notes/{id}/complete:
 *   post:
 *     tags: [Goods Receipt Notes]
 *     summary: Complete a goods receipt note
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Goods receipt note completed }
 *       409: { description: Invalid transition }
 */
router.post('/:id/complete', authMiddleware, receive, c.complete);

/**
 * @openapi
 * /goods_receipt_notes/{id}/cancel:
 *   post:
 *     tags: [Goods Receipt Notes]
 *     summary: Cancel a goods receipt note
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: Goods receipt note cancelled }
 *       409: { description: Invalid transition }
 */
router.post('/:id/cancel', authMiddleware, receive, c.cancel);

module.exports = router;
